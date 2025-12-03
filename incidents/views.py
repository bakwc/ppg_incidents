from rest_framework import generics

from incidents.models import Incident
from incidents.serializers import IncidentSerializer


class IncidentListView(generics.ListAPIView):
    serializer_class = IncidentSerializer

    def get_queryset(self):
        queryset = Incident.objects.all()
        order_by = self.request.query_params.get("order_by")
        if order_by:
            queryset = queryset.order_by(order_by)
        return queryset


class IncidentDetailView(generics.RetrieveAPIView):
    serializer_class = IncidentSerializer
    lookup_field = "uuid"
    queryset = Incident.objects.all()
