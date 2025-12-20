import logging

from django.db.models import Case, Count, Q, When
from django.db.models.functions import ExtractYear
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from incidents.models import Incident
from incidents.serializers import IncidentSerializer
from ppg_incidents.ai_communication import ai_communicator
from ppg_incidents.fts_store import delete_fts, search_fts, upsert_fts
from ppg_incidents.vector_store import delete_embedding, search_similar, init_vector_table, upsert_embedding

logger = logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'is_staff': self.user.is_staff,
            'is_superuser': self.user.is_superuser,
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    def post(self, request):
        return Response({"detail": "Successfully logged out"})


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser
        })


class IncidentPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 100


# Boolean fields that can be filtered
BOOLEAN_FILTER_FIELDS = [
    "potentially_fatal",
    "hardware_failure",
    "bad_hardware_preflight",
    "factor_low_altitude",
    "factor_maneuvers",
    "factor_thermal_weather",
    "factor_rain",
    "factor_rotor_turbulence",
    "factor_wake_turbulence",
    "factor_reflex_profile",
    "factor_helmet_missing",
    "factor_tree_collision",
    "factor_water_landing",
    "factor_ground_starting",
    "factor_powerline_collision",
    "factor_turbulent_conditions",
    "factor_spiral_maneuver",
    "factor_ground_object_collision",
    "factor_released_brake_toggle",
    "factor_wrongly_adjusted_trims",
    "factor_accidental_motor_kill",
    "factor_wrong_throttle_management",
    "factor_accidental_reserve_deployment",
    "factor_oscillations_out_of_control",
    "factor_student_pilot",
    "factor_medical_issues",
    "factor_engine_failure",
    "factor_trimmers_failure",
    "factor_structural_failure",
    "factor_fire",
    "factor_throttle_system_issues",
    "factor_paraglider_failure",
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
    "primary_cause",
]


def apply_filters(queryset, filters, exclude=False):
    """Apply include or exclude filters to a queryset."""
    for field, value in filters.items():
        if field == "wind_speed_ms_min":
            if not exclude:
                queryset = queryset.filter(wind_speed_ms__gte=float(value))
            else:
                queryset = queryset.exclude(wind_speed_ms__gte=float(value))
        elif field == "wind_speed_ms_max":
            if not exclude:
                queryset = queryset.filter(wind_speed_ms__lt=float(value))
            else:
                queryset = queryset.exclude(wind_speed_ms__lt=float(value))
        elif field == "altitude_min":
            if not exclude:
                queryset = queryset.filter(flight_altitude__gte=int(value))
            else:
                queryset = queryset.exclude(flight_altitude__gte=int(value))
        elif field == "altitude_max":
            if not exclude:
                queryset = queryset.filter(flight_altitude__lt=int(value))
            else:
                queryset = queryset.exclude(flight_altitude__lt=int(value))
        elif field == "altitude_not_null":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                if not exclude:
                    queryset = queryset.filter(flight_altitude__isnull=False)
                else:
                    queryset = queryset.exclude(flight_altitude__isnull=False)
        elif field == "wind_speed_ms_not_null":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                if not exclude:
                    queryset = queryset.filter(wind_speed_ms__isnull=False)
                else:
                    queryset = queryset.exclude(wind_speed_ms__isnull=False)
        elif field == "year_min":
            if not exclude:
                queryset = queryset.filter(date__year__gte=int(value))
            else:
                queryset = queryset.exclude(date__year__gte=int(value))
        elif field in BOOLEAN_FILTER_FIELDS:
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                if exclude:
                    queryset = queryset.exclude(**{field: True})
                else:
                    queryset = queryset.filter(**{field: True})
            elif value is False or (isinstance(value, str) and value.lower() == "false"):
                if exclude:
                    queryset = queryset.exclude(**{field: False})
                else:
                    queryset = queryset.filter(**{field: False})
        elif field in CHOICE_FILTER_FIELDS:
            if isinstance(value, list):
                values = value
            else:
                values = [v.strip() for v in str(value).split(",")]
            if "null" in values:
                values = [v for v in values if v != "null"]
                if exclude:
                    queryset = queryset.exclude(**{f"{field}__isnull": True})
                    if values:
                        queryset = queryset.exclude(**{f"{field}__in": values})
                else:
                    if values:
                        queryset = queryset.filter(Q(**{f"{field}__isnull": True}) | Q(**{f"{field}__in": values}))
                    else:
                        queryset = queryset.filter(**{f"{field}__isnull": True})
            else:
                if exclude:
                    queryset = queryset.exclude(**{f"{field}__in": values})
                else:
                    queryset = queryset.filter(**{f"{field}__in": values})
        elif field == "collapse":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                q = (
                    Q(collapse_types__icontains="asymmetric_small") |
                    Q(collapse_types__icontains="asymmetric_medium") |
                    Q(collapse_types__icontains="asymmetric_large") |
                    Q(collapse_types__icontains="frontal") |
                    Q(collapse_types__icontains="unknown")
                )
                if exclude:
                    queryset = queryset.exclude(q)
                else:
                    queryset = queryset.filter(q)
        elif field == "stall":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                if exclude:
                    queryset = queryset.exclude(collapse_types__icontains="full_stall")
                else:
                    queryset = queryset.filter(collapse_types__icontains="full_stall")
        elif field == "spin":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                if exclude:
                    queryset = queryset.exclude(collapse_types__icontains="spin")
                else:
                    queryset = queryset.filter(collapse_types__icontains="spin")
        elif field == "line_twist":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                if exclude:
                    queryset = queryset.exclude(collapse_types__icontains="line_twist")
                else:
                    queryset = queryset.filter(collapse_types__icontains="line_twist")
        elif field == "unknown_collapse":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                if exclude:
                    queryset = queryset.exclude(collapse_types__icontains="unknown")
                else:
                    queryset = queryset.filter(collapse_types__icontains="unknown")
        elif field == "has_video":
            if value is True or (isinstance(value, str) and value.lower() == "true"):
                q = Q(media_links__icontains="youtube") | Q(source_links__icontains="youtube")
                if exclude:
                    queryset = queryset.exclude(q)
                else:
                    queryset = queryset.filter(q)
    return queryset


class UnverifiedIncidentListView(generics.ListAPIView):
    serializer_class = IncidentSerializer

    def get_queryset(self):
        return Incident.all_objects.filter(verified=False).order_by("created_at")


class IncidentListView(generics.ListAPIView):
    serializer_class = IncidentSerializer
    pagination_class = IncidentPagination

    def get_queryset(self):
        semantic_search = self.request.query_params.get("semantic_search")
        text_search = self.request.query_params.get("text_search")
        
        if semantic_search:
            embedding = ai_communicator.get_embedding(semantic_search)
            results = search_similar(embedding, limit=100)
            incident_ids = [r[0] for r in results]
            preserved_order = Case(*[When(id=id, then=pos) for pos, id in enumerate(incident_ids)])
            queryset = Incident.objects.filter(id__in=incident_ids).order_by(preserved_order)
        elif text_search:
            incident_ids = search_fts(text_search, limit=100)
            preserved_order = Case(*[When(id=id, then=pos) for pos, id in enumerate(incident_ids)])
            queryset = Incident.objects.filter(id__in=incident_ids).order_by(preserved_order)
        else:
            queryset = Incident.objects.all()
            order_by = self.request.query_params.get("order_by")
            if order_by:
                queryset = queryset.order_by(order_by)

        # Collect include filters from query params
        include_filters = {}
        for field in BOOLEAN_FILTER_FIELDS + CHOICE_FILTER_FIELDS + ["collapse", "stall", "spin", "line_twist", "unknown_collapse", "has_video"]:
            value = self.request.query_params.get(field)
            if value is not None:
                include_filters[field] = value
        
        # Collect numeric range filters
        for field in ["wind_speed_ms_min", "wind_speed_ms_max", "altitude_min", "altitude_max", "year_min"]:
            value = self.request.query_params.get(field)
            if value is not None:
                include_filters[field] = value
        
        # Collect altitude_not_null filter
        altitude_not_null = self.request.query_params.get("altitude_not_null")
        if altitude_not_null is not None:
            include_filters["altitude_not_null"] = altitude_not_null
        
        # Collect wind_speed_ms_not_null filter
        wind_speed_ms_not_null = self.request.query_params.get("wind_speed_ms_not_null")
        if wind_speed_ms_not_null is not None:
            include_filters["wind_speed_ms_not_null"] = wind_speed_ms_not_null

        # Collect exclude filters from query params
        exclude_filters = {}
        for field in BOOLEAN_FILTER_FIELDS + CHOICE_FILTER_FIELDS:
            value = self.request.query_params.get(f"exclude_{field}")
            if value is not None:
                exclude_filters[field] = value
        for field in ["collapse", "stall", "spin", "line_twist", "unknown_collapse", "has_video"]:
            value = self.request.query_params.get(f"exclude_{field}")
            if value is not None:
                exclude_filters[field] = value
        
        # Collect numeric range exclude filters
        for field in ["wind_speed_ms_min", "wind_speed_ms_max", "altitude_min", "altitude_max", "year_min"]:
            value = self.request.query_params.get(f"exclude_{field}")
            if value is not None:
                exclude_filters[field] = value

        queryset = apply_filters(queryset, include_filters, exclude=False)
        queryset = apply_filters(queryset, exclude_filters, exclude=True)

        # Country filter
        country = self.request.query_params.get("country")
        if country:
            queryset = queryset.filter(country=country)

        # Date range filter (YYYY-MM format)
        date_from = self.request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=f"{date_from}-01")
        
        date_to = self.request.query_params.get("date_to")
        if date_to:
            year, month = map(int, date_to.split("-"))
            if month == 12:
                next_month = f"{year + 1}-01-01"
            else:
                next_month = f"{year}-{month + 1:02d}-01"
            queryset = queryset.filter(date__lt=next_month)

        return queryset


class IncidentDetailView(generics.RetrieveAPIView):
    serializer_class = IncidentSerializer
    lookup_field = "uuid"
    queryset = Incident.all_objects.all()


class IncidentChatView(APIView):
    def post(self, request):
        messages = request.data.get("messages", [])
        incident_data = request.data.get("incident_data")

        result = ai_communicator.incident_chat(messages, incident_data, model="claude-sonnet-4-5-20250929")

        return Response({
            "response": result.get("response"),
            "incident_data": result.get("incident_data"),
            "messages": result.get("messages"),
            "saved": False,
        })


class IncidentSaveView(APIView):
    def post(self, request):
        incident_data = request.data.get("incident_data", {})
        logger.info(f"Save request data: {incident_data}")

        if not request.user.is_staff:
            incident_data["verified"] = False

        serializer = IncidentSerializer(data=incident_data)
        if not serializer.is_valid():
            logger.error(f"Validation errors: {serializer.errors}")
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()

        # Generate and store embedding
        embedding = ai_communicator.get_embedding(incident.to_text())
        upsert_embedding(incident.id, embedding)

        # Update FTS index
        upsert_fts(incident.id, incident.to_text())

        return Response({
            "incident": IncidentSerializer(incident).data,
            "saved": True,
        })


class IncidentUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, uuid):
        logger.info(f"Update request for {uuid}: {request.data}")
        incident = Incident.all_objects.get(uuid=uuid)
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

        # Update FTS index
        upsert_fts(incident.id, incident.to_text())

        return Response({
            "incident": IncidentSerializer(incident).data,
            "saved": True,
        })


class IncidentDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, uuid):
        incident = Incident.all_objects.get(uuid=uuid)
        incident_id = incident.id
        incident.delete()
        delete_embedding(incident_id)
        delete_fts(incident_id)
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
        
        # Medium confidence: country+date OR country+pilot_name OR links
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
        
        # Check for matching links
        links = []
        source_links = incident_data.get("source_links", "")
        media_links = incident_data.get("media_links", "")
        
        if source_links:
            links.extend([link.strip() for link in source_links.split("\n") if link.strip()])
        if media_links:
            links.extend([link.strip() for link in media_links.split("\n") if link.strip()])
        
        if links:
            link_query = Q()
            for link in links:
                link_query |= Q(source_links__icontains=link) | Q(media_links__icontains=link)
            
            by_links = Incident.objects.filter(link_query)
            if exclude_id:
                by_links = by_links.exclude(id=exclude_id)
            medium_matches.update(by_links.values_list("id", flat=True))
        
        if medium_matches:
            incidents = Incident.objects.filter(id__in=medium_matches)
            return Response({
                "confidence": "Medium",
                "incidents": IncidentSerializer(incidents, many=True).data
            })
        
        # Low confidence: semantic search top 3
        model_fields = {f.name for f in Incident._meta.get_fields()}
        filtered_data = {k: v for k, v in incident_data.items() if k in model_fields}
        temp_incident = Incident(**filtered_data)
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


class DashboardStatsView(APIView):
    def post(self, request):
        filter_packs = request.data.get("filter_packs", [])
        results = {}
        
        for pack in filter_packs:
            name = pack["name"]
            include_filters = pack.get("include", {})
            exclude_filters = pack.get("exclude", {})
            
            queryset = Incident.objects.all()
            queryset = apply_filters(queryset, include_filters, exclude=False)
            queryset = apply_filters(queryset, exclude_filters, exclude=True)
            
            results[name] = queryset.count()
        
        return Response(results)


class CountriesView(APIView):
    def get(self, request):
        countries = (
            Incident.objects
            .exclude(country__isnull=True)
            .exclude(country="")
            .values("country")
            .annotate(count=Count("id"))
            .order_by("-count")
            .values_list("country", flat=True)
        )
        return Response(list(countries))


class CountryStatsView(APIView):
    def post(self, request):
        include_filters = request.data.get("include", {})
        exclude_filters = request.data.get("exclude", {})
        limit = request.data.get("limit", 10)
        
        queryset = Incident.objects.all()
        queryset = apply_filters(queryset, include_filters, exclude=False)
        queryset = apply_filters(queryset, exclude_filters, exclude=True)
        
        country_counts = (
            queryset
            .exclude(country__isnull=True)
            .exclude(country="")
            .values("country")
            .annotate(count=Count("id"))
            .order_by("-count")[:limit]
        )
        
        return Response(list(country_counts))


class YearStatsView(APIView):
    def post(self, request):
        include_filters = request.data.get("include", {})
        exclude_filters = request.data.get("exclude", {})
        
        queryset = Incident.objects.all()
        queryset = apply_filters(queryset, include_filters, exclude=False)
        queryset = apply_filters(queryset, exclude_filters, exclude=True)
        
        year_counts = (
            queryset
            .exclude(date__isnull=True)
            .annotate(year=ExtractYear("date"))
            .values("year")
            .annotate(count=Count("id"))
            .order_by("year")
        )
        
        return Response(list(year_counts))


class IncidentDraftsView(generics.ListAPIView):
    serializer_class = IncidentSerializer

    def get_queryset(self):
        uuid = self.kwargs["uuid"]
        return Incident.all_objects.filter(original_uuid=uuid).order_by("-created_at")


class WindSpeedPercentileView(APIView):
    def post(self, request):
        include_filters = request.data.get("include", {})
        exclude_filters = request.data.get("exclude", {})
        percentile = request.data.get("percentile", 40)
        
        queryset = Incident.objects.all()
        queryset = apply_filters(queryset, include_filters, exclude=False)
        queryset = apply_filters(queryset, exclude_filters, exclude=True)
        
        wind_speeds = list(
            queryset
            .exclude(wind_speed_ms__isnull=True)
            .values_list("wind_speed_ms", flat=True)
            .order_by("wind_speed_ms")
        )
        
        if not wind_speeds:
            return Response({"percentile_value": None})
        
        index = int(len(wind_speeds) * percentile / 100)
        percentile_value = wind_speeds[index] if index < len(wind_speeds) else wind_speeds[-1]
        
        return Response({"percentile_value": round(percentile_value, 1)})
