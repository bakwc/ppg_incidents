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

    class CollapseType(models.TextChoices):
        ASYMMETRIC_SMALL = "asymmetric_small", "Asymmetric collapse (<30%)"
        ASYMMETRIC_MEDIUM = "asymmetric_medium", "Asymmetric collapse (30-50%)"
        ASYMMETRIC_LARGE = "asymmetric_large", "Asymmetric collapse (>50%)"
        FRONTAL = "frontal", "Frontal collapse"
        FULL_STALL = "full_stall", "Full stall"
        SPIN = "spin", "Spin"
        LINE_TWIST = "line_twist", "Line twist"
        CRAVATTE = "cravatte", "Cravatte"

    class ParamotorType(models.TextChoices):
        FOOTLAUNCH = "footlaunch", "Footlaunch"
        TRIKE = "trike", "Trike"

    class TrimmerPosition(models.TextChoices):
        CLOSED = "closed", "Closed"
        PARTIALLY_OPEN = "partially_open", "Partially open"
        FULLY_OPEN = "fully_open", "Fully open"

    class AcceleratorPosition(models.TextChoices):
        RELEASED = "released", "Released"
        PARTIALLY_ENGAGED = "partially_engaged", "Partially engaged"
        FULLY_ENGAGED = "fully_engaged", "Fully engaged"

    class PilotActions(models.TextChoices):
        WRONG_INPUT_TRIGGERED = "wrong_input_triggered", "Wrong input triggered incident / was primary reason"
        MOSTLY_WRONG = "mostly_wrong", "Mostly wrong inputs while reacting on incident"
        MIXED = "mixed", "Some correct and some wrong inputs while reacting"
        MOSTLY_CORRECT = "mostly_correct", "Mostly correct inputs while reacting on incident"

    # UUID
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # Title and summary
    title = models.CharField(max_length=300, null=True, blank=True)
    summary = models.TextField(null=True, blank=True)

    # Date and time
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)

    # Location
    country = models.CharField(max_length=100, null=True, blank=True)
    city_or_site = models.CharField(max_length=200, null=True, blank=True)

    # Paramotor
    paramotor_type = models.CharField(max_length=20, choices=ParamotorType.choices, null=True, blank=True)
    paramotor_frame = models.CharField(max_length=100, null=True, blank=True)
    paramotor_engine = models.CharField(max_length=100, null=True, blank=True)

    # Wing
    wing_manufacturer = models.CharField(max_length=100, null=True, blank=True)
    wing_model = models.CharField(max_length=100, null=True, blank=True)
    wing_size = models.CharField(max_length=50, null=True, blank=True)

    # Pilot
    pilot_name = models.CharField(max_length=200, null=True, blank=True)
    pilot_details = models.CharField(max_length=200, null=True, blank=True)

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
    pilot_actions = models.CharField(max_length=30, choices=PilotActions.choices, null=True, blank=True, verbose_name="Pilot actions")
    injury_details = models.TextField(null=True, blank=True, help_text="Details of pilot injuries if any")

    # Hardware
    hardware_failure = models.BooleanField(null=True, blank=True, verbose_name="Hardware failure occurred")
    bad_hardware_preflight = models.BooleanField(null=True, blank=True, verbose_name="Hardware issue could be found on preflight")

    # Collapse sequence
    collapse_types = models.JSONField(
        null=True,
        blank=True,
        help_text="List of collapse types in sequence (e.g., ['asymmetric_medium', 'asymmetric_large', 'frontal', 'line_twist'])",
    )

    # Reserve parachute
    reserve_use = models.CharField(max_length=30, choices=ReserveUse.choices, null=True, blank=True)

    # Surface type
    surface_type = models.CharField(max_length=100, null=True, blank=True, help_text="water / forest / rocks / mountains / etc.")

    # Confidence
    cause_confidence = models.CharField(max_length=20, choices=CauseConfidence.choices, null=True, blank=True)

    # Factors
    factor_low_altitude = models.BooleanField(null=True, blank=True, verbose_name="Low flight altitude")
    factor_maneuvers = models.BooleanField(null=True, blank=True, verbose_name="Performed maneuvers")
    factor_accelerator = models.CharField(max_length=20, choices=AcceleratorPosition.choices, null=True, blank=True, verbose_name="Accelerator position")
    factor_thermal_weather = models.BooleanField(null=True, blank=True, verbose_name="Thermally active weather")
    factor_rotor_turbulence = models.BooleanField(null=True, blank=True, verbose_name="Entered rotor turbulence")
    factor_trimmer_position = models.CharField(max_length=20, choices=TrimmerPosition.choices, null=True, blank=True, verbose_name="Trimmer position")
    factor_reflex_profile = models.BooleanField(null=True, blank=True, verbose_name="Presence of reflex profile")
    factor_helmet_missing = models.BooleanField(null=True, blank=True, verbose_name="Helmet missing")
    factor_tree_collision = models.BooleanField(null=True, blank=True, verbose_name="Landed / collided with tree")
    factor_water_landing = models.BooleanField(null=True, blank=True, verbose_name="Landed / fell in water")
    factor_ground_starting = models.BooleanField(null=True, blank=True, verbose_name="Ground starting")
    factor_powerline_collision = models.BooleanField(null=True, blank=True, verbose_name="Powerline collision")

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

    def to_text(self) -> str:
        """Convert incident to searchable text for embedding."""
        parts = []

        # Core text fields
        if self.title:
            parts.append(f"Title: {self.title}")
        if self.summary:
            parts.append(f"Summary: {self.summary}")
        if self.description:
            parts.append(f"Description: {self.description}")
        if self.causes_description:
            parts.append(f"Causes: {self.causes_description}")
        if self.injury_details:
            parts.append(f"Injuries: {self.injury_details}")

        # Date and location
        if self.date:
            parts.append(f"Date: {self.date}")
        if self.country:
            parts.append(f"Country: {self.country}")
        if self.city_or_site:
            parts.append(f"Location: {self.city_or_site}")

        # Equipment
        if self.paramotor_type:
            parts.append(f"Paramotor type: {self.get_paramotor_type_display()}")
        if self.paramotor_frame:
            parts.append(f"Frame: {self.paramotor_frame}")
        if self.paramotor_engine:
            parts.append(f"Engine: {self.paramotor_engine}")
        if self.wing_manufacturer:
            parts.append(f"Wing manufacturer: {self.wing_manufacturer}")
        if self.wing_model:
            parts.append(f"Wing model: {self.wing_model}")
        if self.wing_size:
            parts.append(f"Wing size: {self.wing_size}")

        # Pilot
        if self.pilot_name:
            parts.append(f"Pilot name: {self.pilot_name}")
        if self.pilot_details:
            parts.append(f"Pilot details: {self.pilot_details}")

        # Flight details
        if self.flight_altitude:
            parts.append(f"Altitude: {self.flight_altitude}m")
        if self.flight_phase:
            parts.append(f"Flight phase: {self.get_flight_phase_display()}")

        # Incident details
        if self.severity:
            parts.append(f"Severity: {self.get_severity_display()}")
        if self.potentially_fatal is not None:
            parts.append(f"Potentially fatal: {'yes' if self.potentially_fatal else 'no'}")
        if self.pilot_actions:
            parts.append(f"Pilot actions: {self.get_pilot_actions_display()}")

        # Hardware
        if self.hardware_failure is not None:
            parts.append(f"Hardware failure: {'yes' if self.hardware_failure else 'no'}")
        if self.bad_hardware_preflight is not None:
            parts.append(f"Hardware issue detectable on preflight: {'yes' if self.bad_hardware_preflight else 'no'}")

        # Collapse types
        if self.collapse_types:
            collapse_labels = []
            for ct in self.collapse_types:
                label = dict(self.CollapseType.choices).get(ct, ct)
                collapse_labels.append(label)
            parts.append(f"Collapse sequence: {', '.join(collapse_labels)}")

        # Reserve
        if self.reserve_use:
            parts.append(f"Reserve: {self.get_reserve_use_display()}")

        # Surface
        if self.surface_type:
            parts.append(f"Surface: {self.surface_type}")

        # Confidence
        if self.cause_confidence:
            parts.append(f"Cause confidence: {self.get_cause_confidence_display()}")

        # Factors
        factors = []
        if self.factor_low_altitude:
            factors.append("low altitude")
        if self.factor_maneuvers:
            factors.append("maneuvers")
        if self.factor_accelerator:
            factors.append(f"accelerator {self.get_factor_accelerator_display()}")
        if self.factor_thermal_weather:
            factors.append("thermal weather")
        if self.factor_rotor_turbulence:
            factors.append("rotor turbulence")
        if self.factor_trimmer_position:
            factors.append(f"trimmer {self.get_factor_trimmer_position_display()}")
        if self.factor_reflex_profile:
            factors.append("reflex profile")
        if self.factor_helmet_missing:
            factors.append("no helmet")
        if self.factor_tree_collision:
            factors.append("tree collision")
        if self.factor_water_landing:
            factors.append("water landing")
        if self.factor_ground_starting:
            factors.append("ground starting")
        if self.factor_powerline_collision:
            factors.append("powerline collision")
        if factors:
            parts.append(f"Factors: {', '.join(factors)}")

        # Weather
        if self.wind_speed:
            parts.append(f"Wind: {self.wind_speed}")
        if self.meteorological_conditions:
            parts.append(f"Weather: {self.meteorological_conditions}")
        if self.thermal_conditions:
            parts.append(f"Thermals: {self.thermal_conditions}")

        return "\n".join(parts)
