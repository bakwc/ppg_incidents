import csv

from django.db.models import Case, When
from django.http import HttpResponse
from rest_framework.views import APIView

from incidents.models import Incident
from incidents.views import BOOLEAN_FILTER_FIELDS, CHOICE_FILTER_FIELDS, apply_filters
from ppg_incidents.ai_communication import ai_communicator
from ppg_incidents.fts_store import search_fts
from ppg_incidents.vector_store import search_similar


class IncidentCSVExportView(APIView):
    def get(self, request):
        semantic_search = request.query_params.get("semantic_search")
        text_search = request.query_params.get("text_search")
        
        if semantic_search:
            embedding = ai_communicator.get_embedding(semantic_search)
            results = search_similar(embedding, limit=10000)
            incident_ids = [r[0] for r in results]
            preserved_order = Case(*[When(id=id, then=pos) for pos, id in enumerate(incident_ids)])
            queryset = Incident.objects.filter(id__in=incident_ids).order_by(preserved_order)
        elif text_search:
            incident_ids = search_fts(text_search, limit=10000)
            preserved_order = Case(*[When(id=id, then=pos) for pos, id in enumerate(incident_ids)])
            queryset = Incident.objects.filter(id__in=incident_ids).order_by(preserved_order)
        else:
            queryset = Incident.objects.all()
            order_by = request.query_params.get("order_by")
            if order_by:
                queryset = queryset.order_by(order_by)

        include_filters = {}
        for field in BOOLEAN_FILTER_FIELDS + CHOICE_FILTER_FIELDS + ["collapse", "stall", "spin", "line_twist", "unknown_collapse", "has_video"]:
            value = request.query_params.get(field)
            if value is not None:
                include_filters[field] = value
        
        for field in ["wind_speed_ms_min", "wind_speed_ms_max", "altitude_min", "altitude_max", "year_min"]:
            value = request.query_params.get(field)
            if value is not None:
                include_filters[field] = value
        
        altitude_not_null = request.query_params.get("altitude_not_null")
        if altitude_not_null is not None:
            include_filters["altitude_not_null"] = altitude_not_null
        
        wind_speed_ms_not_null = request.query_params.get("wind_speed_ms_not_null")
        if wind_speed_ms_not_null is not None:
            include_filters["wind_speed_ms_not_null"] = wind_speed_ms_not_null

        exclude_filters = {}
        for field in BOOLEAN_FILTER_FIELDS + CHOICE_FILTER_FIELDS:
            value = request.query_params.get(f"exclude_{field}")
            if value is not None:
                exclude_filters[field] = value
        for field in ["collapse", "stall", "spin", "line_twist", "unknown_collapse", "has_video"]:
            value = request.query_params.get(f"exclude_{field}")
            if value is not None:
                exclude_filters[field] = value
        
        for field in ["wind_speed_ms_min", "wind_speed_ms_max", "altitude_min", "altitude_max", "year_min"]:
            value = request.query_params.get(f"exclude_{field}")
            if value is not None:
                exclude_filters[field] = value

        queryset = apply_filters(queryset, include_filters, exclude=False)
        queryset = apply_filters(queryset, exclude_filters, exclude=True)

        country = request.query_params.get("country")
        if country:
            queryset = queryset.filter(country=country)

        date_from = request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=f"{date_from}-01")
        
        date_to = request.query_params.get("date_to")
        if date_to:
            year, month = map(int, date_to.split("-"))
            if month == 12:
                next_month = f"{year + 1}-01-01"
            else:
                next_month = f"{year}-{month + 1:02d}-01"
            queryset = queryset.filter(date__lt=next_month)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="incidents.csv"'

        writer = csv.writer(response)
        
        writer.writerow([
            'UUID', 'Title', 'Date', 'Time', 'Country', 'City/Site', 'Severity', 'Potentially Fatal',
            'Flight Phase', 'Flight Altitude', 'Pilot Name', 'Pilot Actions', 'Primary Cause',
            'Hardware Failure', 'Bad Hardware Preflight', 'Reserve Use', 'Surface Type',
            'Paramotor Type', 'Paramotor Frame', 'Paramotor Engine',
            'Wing Manufacturer', 'Wing Model', 'Wing Size',
            'Wind Speed', 'Wind Speed (m/s)', 'Meteorological Conditions', 'Thermal Conditions',
            'Cause Confidence', 'Collapse Types',
            'Factor Low Altitude', 'Factor Maneuvers', 'Factor Accelerator', 'Factor Thermal Weather',
            'Factor Rain', 'Factor Rotor Turbulence', 'Factor Wake Turbulence', 'Factor Trimmer Position',
            'Factor Reflex Profile', 'Factor Helmet Missing', 'Factor Tree Collision', 'Factor Water Landing',
            'Factor Ground Starting', 'Factor Powerline Collision', 'Factor Turbulent Conditions',
            'Factor Spiral Maneuver', 'Factor Mid Air Collision', 'Factor Ground Object Collision',
            'Factor Released Brake Toggle', 'Factor Wrongly Adjusted Trims', 'Factor Accidental Motor Kill',
            'Factor Wrong Throttle Management', 'Factor Accidental Reserve Deployment',
            'Factor Oscillations Out Of Control', 'Factor Student Pilot', 'Factor Medical Issues',
            'Factor Engine Failure', 'Factor Trimmers Failure', 'Factor Structural Failure',
            'Factor Fire', 'Factor Throttle System Issues', 'Factor Paraglider Failure',
            'Summary', 'Description', 'Causes Description', 'Injury Details', 'Pilot Details',
            'Source Links', 'Media Links'
        ])

        for incident in queryset:
            writer.writerow([
                str(incident.uuid),
                incident.title or '',
                incident.date or '',
                incident.time or '',
                incident.country or '',
                incident.city_or_site or '',
                incident.get_severity_display() if incident.severity else '',
                'Yes' if incident.potentially_fatal else 'No' if incident.potentially_fatal is False else '',
                incident.get_flight_phase_display() if incident.flight_phase else '',
                incident.flight_altitude or '',
                incident.pilot_name or '',
                incident.get_pilot_actions_display() if incident.pilot_actions else '',
                incident.get_primary_cause_display() if incident.primary_cause else '',
                'Yes' if incident.hardware_failure else 'No' if incident.hardware_failure is False else '',
                'Yes' if incident.bad_hardware_preflight else 'No' if incident.bad_hardware_preflight is False else '',
                incident.get_reserve_use_display() if incident.reserve_use else '',
                incident.surface_type or '',
                incident.get_paramotor_type_display() if incident.paramotor_type else '',
                incident.paramotor_frame or '',
                incident.paramotor_engine or '',
                incident.wing_manufacturer or '',
                incident.wing_model or '',
                incident.wing_size or '',
                incident.wind_speed or '',
                incident.wind_speed_ms or '',
                incident.meteorological_conditions or '',
                incident.thermal_conditions or '',
                incident.get_cause_confidence_display() if incident.cause_confidence else '',
                ', '.join(incident.collapse_types) if incident.collapse_types else '',
                'Yes' if incident.factor_low_altitude else '',
                'Yes' if incident.factor_maneuvers else '',
                incident.get_factor_accelerator_display() if incident.factor_accelerator else '',
                'Yes' if incident.factor_thermal_weather else '',
                'Yes' if incident.factor_rain else '',
                'Yes' if incident.factor_rotor_turbulence else '',
                'Yes' if incident.factor_wake_turbulence else '',
                incident.get_factor_trimmer_position_display() if incident.factor_trimmer_position else '',
                'Yes' if incident.factor_reflex_profile else '',
                'Yes' if incident.factor_helmet_missing else '',
                'Yes' if incident.factor_tree_collision else '',
                'Yes' if incident.factor_water_landing else '',
                'Yes' if incident.factor_ground_starting else '',
                'Yes' if incident.factor_powerline_collision else '',
                'Yes' if incident.factor_turbulent_conditions else '',
                'Yes' if incident.factor_spiral_maneuver else '',
                incident.get_factor_mid_air_collision_display() if incident.factor_mid_air_collision else '',
                'Yes' if incident.factor_ground_object_collision else '',
                'Yes' if incident.factor_released_brake_toggle else '',
                'Yes' if incident.factor_wrongly_adjusted_trims else '',
                'Yes' if incident.factor_accidental_motor_kill else '',
                'Yes' if incident.factor_wrong_throttle_management else '',
                'Yes' if incident.factor_accidental_reserve_deployment else '',
                'Yes' if incident.factor_oscillations_out_of_control else '',
                'Yes' if incident.factor_student_pilot else '',
                'Yes' if incident.factor_medical_issues else '',
                'Yes' if incident.factor_engine_failure else '',
                'Yes' if incident.factor_trimmers_failure else '',
                'Yes' if incident.factor_structural_failure else '',
                'Yes' if incident.factor_fire else '',
                'Yes' if incident.factor_throttle_system_issues else '',
                'Yes' if incident.factor_paraglider_failure else '',
                incident.summary or '',
                incident.description or '',
                incident.causes_description or '',
                incident.injury_details or '',
                incident.pilot_details or '',
                incident.source_links or '',
                incident.media_links or ''
            ])

        return response

