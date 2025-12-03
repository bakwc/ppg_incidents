from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from incidents.models import Incident
from incidents.serializers import IncidentSerializer
from ppg_incidents.ai_communication import ai_communicator


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


class IncidentChatView(APIView):
    def post(self, request):
        messages = request.data.get("messages", [])
        incident_data = request.data.get("incident_data")

        result = ai_communicator.incident_chat(messages, incident_data)

        return Response({
            "response": result.get("response"),
            "incident_data": result.get("incident_data"),
            "saved": False,
        })


class IncidentSaveView(APIView):
    def post(self, request):
        incident_data = request.data.get("incident_data", {})

        serializer = IncidentSerializer(data=incident_data)
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()

        return Response({
            "incident": IncidentSerializer(incident).data,
            "saved": True,
        })
