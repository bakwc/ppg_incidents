import logging

from django.db.models import Case, Q, When
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from incidents.models import Incident
from incidents.serializers import IncidentSerializer
from ppg_incidents.ai_communication import ai_communicator
from ppg_incidents.vector_store import upsert_embedding, search_similar, init_vector_table

logger = logging.getLogger(__name__)


class IncidentListView(generics.ListAPIView):
    serializer_class = IncidentSerializer

    # Boolean fields that can be filtered
    BOOLEAN_FILTER_FIELDS = [
        "potentially_fatal",
        "hardware_failure",
        "bad_hardware_preflight",
        "factor_low_altitude",
        "factor_maneuvers",
        "factor_thermal_weather",
        "factor_rotor_turbulence",
        "factor_reflex_profile",
        "factor_helmet_missing",
        "factor_tree_collision",
        "factor_water_landing",
        "factor_ground_starting",
        "factor_powerline_collision",
        "factor_turbulent_conditions",
        "factor_spiral_maneuver",
    ]

    # Choice fields that can be filtered
    CHOICE_FILTER_FIELDS = [
        "flight_phase",
        "severity",
        "reserve_use",
        "cause_confidence",
        "paramotor_type",
        "factor_accelerator",
        "factor_trimmer_position",
        "pilot_actions",
        "factor_mid_air_collision",
    ]

    def get_queryset(self):
        semantic_search = self.request.query_params.get("semantic_search")
        
        if semantic_search:
            embedding = ai_communicator.get_embedding(semantic_search)
            results = search_similar(embedding, limit=100)
            incident_ids = [r[0] for r in results]
            preserved_order = Case(*[When(id=id, then=pos) for pos, id in enumerate(incident_ids)])
            queryset = Incident.objects.filter(id__in=incident_ids).order_by(preserved_order)
        else:
            queryset = Incident.objects.all()
            order_by = self.request.query_params.get("order_by")
            if order_by:
                queryset = queryset.order_by(order_by)

        # Apply boolean filters
        for field in self.BOOLEAN_FILTER_FIELDS:
            value = self.request.query_params.get(field)
            if value is not None:
                if value.lower() == "true":
                    queryset = queryset.filter(**{field: True})
                elif value.lower() == "false":
                    queryset = queryset.filter(**{field: False})

        # Apply choice filters
        for field in self.CHOICE_FILTER_FIELDS:
            value = self.request.query_params.get(field)
            if value:
                values = [v.strip() for v in value.split(",")]
                queryset = queryset.filter(**{f"{field}__in": values})

        # Custom collapse_types filters
        if self.request.query_params.get("collapse", "").lower() == "true":
            queryset = queryset.filter(
                Q(collapse_types__contains="asymmetric_small") |
                Q(collapse_types__contains="asymmetric_medium") |
                Q(collapse_types__contains="asymmetric_large") |
                Q(collapse_types__contains="frontal")
            )

        if self.request.query_params.get("stall", "").lower() == "true":
            queryset = queryset.filter(collapse_types__contains="full_stall")

        if self.request.query_params.get("spin", "").lower() == "true":
            queryset = queryset.filter(collapse_types__contains="spin")

        if self.request.query_params.get("line_twist", "").lower() == "true":
            queryset = queryset.filter(collapse_types__contains="line_twist")

        # Apply boolean exclude filters
        for field in self.BOOLEAN_FILTER_FIELDS:
            value = self.request.query_params.get(f"exclude_{field}")
            if value is not None:
                if value.lower() == "true":
                    queryset = queryset.exclude(**{field: True})
                elif value.lower() == "false":
                    queryset = queryset.exclude(**{field: False})

        # Apply choice exclude filters
        for field in self.CHOICE_FILTER_FIELDS:
            value = self.request.query_params.get(f"exclude_{field}")
            if value:
                values = [v.strip() for v in value.split(",")]
                queryset = queryset.exclude(**{f"{field}__in": values})

        # Custom collapse_types exclude filters
        if self.request.query_params.get("exclude_collapse", "").lower() == "true":
            queryset = queryset.exclude(
                Q(collapse_types__contains="asymmetric_small") |
                Q(collapse_types__contains="asymmetric_medium") |
                Q(collapse_types__contains="asymmetric_large") |
                Q(collapse_types__contains="frontal")
            )

        if self.request.query_params.get("exclude_stall", "").lower() == "true":
            queryset = queryset.exclude(collapse_types__contains="full_stall")

        if self.request.query_params.get("exclude_spin", "").lower() == "true":
            queryset = queryset.exclude(collapse_types__contains="spin")

        if self.request.query_params.get("exclude_line_twist", "").lower() == "true":
            queryset = queryset.exclude(collapse_types__contains="line_twist")

        return queryset


class IncidentDetailView(generics.RetrieveAPIView):
    serializer_class = IncidentSerializer
    lookup_field = "uuid"
    queryset = Incident.objects.all()


class IncidentChatView(APIView):
    def post(self, request):
        messages = request.data.get("messages", [])
        incident_data = request.data.get("incident_data")

        result = ai_communicator.incident_chat(messages, incident_data, model="claude-sonnet-4-5-20250929")

        return Response({
            "response": result.get("response"),
            "incident_data": result.get("incident_data"),
            "saved": False,
        })


class IncidentSaveView(APIView):
    def post(self, request):
        incident_data = request.data.get("incident_data", {})
        logger.info(f"Save request data: {incident_data}")

        serializer = IncidentSerializer(data=incident_data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()

        # Generate and store embedding
        embedding = ai_communicator.get_embedding(incident.to_text())
        upsert_embedding(incident.id, embedding)

        return Response({
            "incident": IncidentSerializer(incident).data,
            "saved": True,
        })


class IncidentUpdateView(APIView):
    def put(self, request, uuid):
        logger.info(f"Update request for {uuid}: {request.data}")
        incident = Incident.objects.get(uuid=uuid)
        incident_data = request.data.get("incident_data", {})
        logger.info(f"Incident data to update: {incident_data}")

        serializer = IncidentSerializer(incident, data=incident_data, partial=True)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()

        # Regenerate and store embedding
        embedding = ai_communicator.get_embedding(incident.to_text())
        upsert_embedding(incident.id, embedding)

        return Response({
            "incident": IncidentSerializer(incident).data,
            "saved": True,
        })


class IncidentDeleteView(APIView):
    def delete(self, request, uuid):
        incident = Incident.objects.get(uuid=uuid)
        incident.delete()
        return Response({"deleted": True})


class IncidentSearchView(APIView):
    def post(self, request):
        query = request.data.get("query", "")
        limit = request.data.get("limit", 10)

        embedding = ai_communicator.get_embedding(query)
        results = search_similar(embedding, limit=limit)

        incident_ids = [r[0] for r in results]
        distances = {r[0]: r[1] for r in results}

        incidents = Incident.objects.filter(id__in=incident_ids)
        incidents_by_id = {i.id: i for i in incidents}

        # Preserve order from search results
        ordered_incidents = [incidents_by_id[id] for id in incident_ids if id in incidents_by_id]

        return Response({
            "results": [
                {
                    "incident": IncidentSerializer(inc).data,
                    "distance": distances[inc.id]
                }
                for inc in ordered_incidents
            ]
        })


class IncidentDuplicatesView(APIView):
    def post(self, request):
        incident_data = request.data.get("incident_data", {})
        limit = request.data.get("limit", 5)
        exclude_uuid = request.data.get("exclude_uuid")

        # Create a temporary incident object for text generation
        temp_incident = Incident(**incident_data)

        embedding = ai_communicator.get_embedding(temp_incident.to_text())

        exclude_id = None
        if exclude_uuid:
            existing = Incident.objects.filter(uuid=exclude_uuid).first()
            if existing:
                exclude_id = existing.id

        results = search_similar(embedding, limit=limit, exclude_id=exclude_id)

        incident_ids = [r[0] for r in results]
        distances = {r[0]: r[1] for r in results}

        incidents = Incident.objects.filter(id__in=incident_ids)
        incidents_by_id = {i.id: i for i in incidents}

        ordered_incidents = [incidents_by_id[id] for id in incident_ids if id in incidents_by_id]

        return Response({
            "duplicates": [
                {
                    "incident": IncidentSerializer(inc).data,
                    "distance": distances[inc.id]
                }
                for inc in ordered_incidents
            ]
        })


class CheckDuplicateView(APIView):
    def post(self, request):
        incident_data = request.data.get("incident_data", {})
        exclude_uuid = request.data.get("exclude_uuid")
        
        exclude_id = None
        if exclude_uuid:
            existing = Incident.objects.filter(uuid=exclude_uuid).first()
            if existing:
                exclude_id = existing.id
        
        country = incident_data.get("country")
        date = incident_data.get("date")
        city_or_site = incident_data.get("city_or_site")
        pilot_name = incident_data.get("pilot_name")
        
        # High confidence: match by country, date, location, pilot_name
        if country and date and city_or_site and pilot_name:
            matches = Incident.objects.filter(
                country=country,
                date=date,
                city_or_site=city_or_site,
                pilot_name=pilot_name
            )
            if exclude_id:
                matches = matches.exclude(id=exclude_id)
            if matches.exists():
                return Response({
                    "confidence": "High",
                    "incidents": IncidentSerializer(matches, many=True).data
                })
        
        # Medium confidence: country+date OR country+pilot_name
        medium_matches = set()
        
        if country and date:
            by_country_date = Incident.objects.filter(country=country, date=date)
            if exclude_id:
                by_country_date = by_country_date.exclude(id=exclude_id)
            medium_matches.update(by_country_date.values_list("id", flat=True))
        
        if country and pilot_name:
            by_country_pilot = Incident.objects.filter(country=country, pilot_name=pilot_name)
            if exclude_id:
                by_country_pilot = by_country_pilot.exclude(id=exclude_id)
            medium_matches.update(by_country_pilot.values_list("id", flat=True))
        
        if medium_matches:
            incidents = Incident.objects.filter(id__in=medium_matches)
            return Response({
                "confidence": "Medium",
                "incidents": IncidentSerializer(incidents, many=True).data
            })
        
        # Low confidence: semantic search top 3
        temp_incident = Incident(**incident_data)
        embedding = ai_communicator.get_embedding(temp_incident.to_text())
        results = search_similar(embedding, limit=3, exclude_id=exclude_id)
        
        incident_ids = [r[0] for r in results]
        incidents = Incident.objects.filter(id__in=incident_ids)
        incidents_by_id = {i.id: i for i in incidents}
        ordered_incidents = [incidents_by_id[id] for id in incident_ids if id in incidents_by_id]
        
        return Response({
            "confidence": "Low",
            "incidents": IncidentSerializer(ordered_incidents, many=True).data
        })
