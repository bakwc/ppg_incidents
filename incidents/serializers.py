from rest_framework import serializers

from incidents.models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    text_content = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = "__all__"

    def get_text_content(self, obj):
        return obj.to_text()

    def to_internal_value(self, data):
        data = dict(data)
        # Convert empty strings to None for all nullable fields
        for field_name in list(data.keys()):
            if data[field_name] == "":
                data[field_name] = None
        # Convert invalid choice field values to None
        choice_fields = {
            "factor_accelerator": [c[0] for c in Incident.AcceleratorPosition.choices],
            "factor_trimmer_position": [c[0] for c in Incident.TrimmerPosition.choices],
            "pilot_actions": [c[0] for c in Incident.PilotActions.choices],
            "flight_phase": [c[0] for c in Incident.FlightPhase.choices],
            "severity": [c[0] for c in Incident.Severity.choices],
            "reserve_use": [c[0] for c in Incident.ReserveUse.choices],
            "cause_confidence": [c[0] for c in Incident.CauseConfidence.choices],
            "paramotor_type": [c[0] for c in Incident.ParamotorType.choices],
            "factor_mid_air_collision": [c[0] for c in Incident.MidAirCollision.choices],
        }
        for field_name, valid_values in choice_fields.items():
            if field_name in data and data[field_name] not in valid_values and data[field_name] is not None:
                data[field_name] = None
        return super().to_internal_value(data)

