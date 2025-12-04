from django.urls import path

from incidents.views import (
    CheckDuplicateView,
    IncidentChatView,
    IncidentDetailView,
    IncidentDuplicatesView,
    IncidentListView,
    IncidentSaveView,
    IncidentSearchView,
    IncidentUpdateView,
)

urlpatterns = [
    path("incidents", IncidentListView.as_view(), name="incident-list"),
    path("incident/<uuid:uuid>", IncidentDetailView.as_view(), name="incident-detail"),
    path("incident/<uuid:uuid>/update", IncidentUpdateView.as_view(), name="incident-update"),
    path("incident/chat", IncidentChatView.as_view(), name="incident-chat"),
    path("incident/save", IncidentSaveView.as_view(), name="incident-save"),
    path("incident/check_duplicate", CheckDuplicateView.as_view(), name="incident-check-duplicate"),
    path("incidents/search", IncidentSearchView.as_view(), name="incident-search"),
    path("incidents/duplicates", IncidentDuplicatesView.as_view(), name="incident-duplicates"),
]

