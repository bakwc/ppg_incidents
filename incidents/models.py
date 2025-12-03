import uuid

from django.db import models


class Incident(models.Model):

    class FlightPhase(models.TextChoices):
        TAKEOFF = "takeoff", "Takeoff"
        LANDING = "landing", "Landing"
        FLIGHT = "flight", "Flight"

    class Severity(models.TextChoices):
        FATAL = "fatal", "Fatal"
        SERIOUS = "serious", "Serious"
        MINOR = "minor", "Minor"

    class ReserveUse(models.TextChoices):
        NOT_DEPLOYED = "not_deployed", "Not deployed"
        NO_TIME = "no_time", "Did not have time to open"
        TANGLED = "tangled", "Became tangled"
        PARTIALLY_OPENED = "partially_opened", "Partially opened"
        FULLY_OPENED = "fully_opened", "Fully opened"

    class CauseConfidence(models.TextChoices):
        MAXIMUM = "maximum", "Maximum — exactly determined what happened"
        HIGH = "high", "High — very likely identified what happened"
        LOW = "low", "Low — not exactly known but plausible assumptions"
        MINIMAL = "minimal", "Minimal — nothing is clear"

    # UUID
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Date and time
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)

    # Location
    country = models.CharField(max_length=100, null=True, blank=True)
    city_or_site = models.CharField(max_length=200, null=True, blank=True)

    # Paramotor
    paramotor_frame = models.CharField(max_length=100, null=True, blank=True)
    paramotor_engine = models.CharField(max_length=100, null=True, blank=True)

    # Wing
    wing_manufacturer = models.CharField(max_length=100, null=True, blank=True)
    wing_model = models.CharField(max_length=100, null=True, blank=True)
    wing_size = models.CharField(max_length=50, null=True, blank=True)

    # Pilot
    pilot = models.CharField(max_length=200, null=True, blank=True)

    # Flight details
    flight_altitude = models.IntegerField(null=True, blank=True, help_text="Altitude in meters")
    flight_phase = models.CharField(max_length=20, choices=FlightPhase.choices, null=True, blank=True)

    # Incident details
    severity = models.CharField(max_length=20, choices=Severity.choices, null=True, blank=True)
    potentially_fatal = models.BooleanField(
        null=True,
        blank=True,
        help_text="Could have resulted in death if it occurred at a different altitude / reserve did not deploy / pilot was less lucky",
    )
    description = models.TextField(null=True, blank=True)
    causes_description = models.TextField(null=True, blank=True)

    # Reserve parachute
    reserve_use = models.CharField(max_length=30, choices=ReserveUse.choices, null=True, blank=True)

    # Surface type
    surface_type = models.CharField(max_length=100, null=True, blank=True, help_text="water / forest / rocks / mountains / etc.")

    # Confidence
    cause_confidence = models.CharField(max_length=20, choices=CauseConfidence.choices, null=True, blank=True)

    # Factors
    factor_low_altitude = models.BooleanField(null=True, blank=True, verbose_name="Low flight altitude")
    factor_maneuvers = models.BooleanField(null=True, blank=True, verbose_name="Performed maneuvers")
    factor_accelerator = models.BooleanField(null=True, blank=True, verbose_name="Accelerator position")
    factor_thermal_weather = models.BooleanField(null=True, blank=True, verbose_name="Thermally active weather")
    factor_rotor_turbulence = models.BooleanField(null=True, blank=True, verbose_name="Entered rotor turbulence")
    factor_trimmer_position = models.BooleanField(null=True, blank=True, verbose_name="Trimmer position")
    factor_reflex_profile = models.BooleanField(null=True, blank=True, verbose_name="Presence of reflex profile")
    factor_helmet_worn = models.BooleanField(null=True, blank=True, verbose_name="Helmet worn")
    factor_tree_collision = models.BooleanField(null=True, blank=True, verbose_name="Landed / collided with tree")
    factor_water_landing = models.BooleanField(null=True, blank=True, verbose_name="Landed / fell in water")

    # Links and media
    source_links = models.TextField(null=True, blank=True, help_text="Links to source / analysis (one per line)")
    media_links = models.TextField(null=True, blank=True, help_text="Videos / photos / reports (one per line)")

    # Weather conditions
    wind_speed = models.CharField(max_length=100, null=True, blank=True, help_text="Wind speed / gusts")
    meteorological_conditions = models.TextField(null=True, blank=True)
    thermal_conditions = models.TextField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-time"]

    def __str__(self):
        return f"{self.date} - {self.country} - {self.severity}"
