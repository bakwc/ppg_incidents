from django.urls import path

from incidents.views import IncidentChatView, IncidentDetailView, IncidentListView, IncidentSaveView

urlpatterns = [
    path("incidents", IncidentListView.as_view(), name="incident-list"),
    path("incident/<uuid:uuid>", IncidentDetailView.as_view(), name="incident-detail"),
    path("incident/chat", IncidentChatView.as_view(), name="incident-chat"),
    path("incident/save", IncidentSaveView.as_view(), name="incident-save"),
]

