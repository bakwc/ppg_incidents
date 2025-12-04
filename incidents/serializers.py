from rest_framework import serializers

from incidents.models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = "__all__"

    def to_internal_value(self, data):
        # Convert "0" or empty strings to None for choice fields
        choice_fields = ["factor_accelerator", "factor_trimmer_position", "pilot_actions"]
        for field in choice_fields:
            if field in data and data[field] in ("0", ""):
                data[field] = None
        return super().to_internal_value(data)

