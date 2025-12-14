from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from incidents.views import (
    CheckDuplicateView,
    CountriesView,
    CountryStatsView,
    CurrentUserView,
    CustomTokenObtainPairView,
    DashboardStatsView,
    IncidentChatView,
    IncidentDeleteView,
    IncidentDetailView,
    IncidentDuplicatesView,
    IncidentListView,
    IncidentSaveView,
    IncidentSearchView,
    IncidentUpdateView,
    LogoutView,
    UnverifiedIncidentListView,
    YearStatsView,
)

urlpatterns = [
    path("auth/login", CustomTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("auth/refresh", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/me", CurrentUserView.as_view(), name="current-user"),
    path("incidents", IncidentListView.as_view(), name="incident-list"),
    path("incidents/unverified", UnverifiedIncidentListView.as_view(), name="incident-unverified-list"),
    path("incident/<uuid:uuid>", IncidentDetailView.as_view(), name="incident-detail"),
    path("incident/<uuid:uuid>/update", IncidentUpdateView.as_view(), name="incident-update"),
    path("incident/<uuid:uuid>/delete", IncidentDeleteView.as_view(), name="incident-delete"),
    path("incident/chat", IncidentChatView.as_view(), name="incident-chat"),
    path("incident/save", IncidentSaveView.as_view(), name="incident-save"),
    path("incident/check_duplicate", CheckDuplicateView.as_view(), name="incident-check-duplicate"),
    path("incidents/search", IncidentSearchView.as_view(), name="incident-search"),
    path("incidents/duplicates", IncidentDuplicatesView.as_view(), name="incident-duplicates"),
    path("dashboard_stats", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("countries", CountriesView.as_view(), name="countries"),
    path("country_stats", CountryStatsView.as_view(), name="country-stats"),
    path("year_stats", YearStatsView.as_view(), name="year-stats"),
]

