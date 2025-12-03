from django.urls import path

from incidents.views import IncidentDetailView, IncidentListView

urlpatterns = [
    path("incidents", IncidentListView.as_view(), name="incident-list"),
    path("incident/<uuid:uuid>", IncidentDetailView.as_view(), name="incident-detail"),
]

