export const PRIMARY_CAUSE_HINTS = {
  turbulence: "Unexpected air disturbance causing wing collapse or loss of control. Often from thermal activity, rotor zones, or weather fronts.",
  wrong_control_input: "The pilot caused the incident through aggressive maneuvers, excessive brake application, initiating steep turns, aggressive throttle use, or losing grip of the brake, among other incorrect control inputs.",
  hardware_failure: "Mechanical or structural failure of equipment during flight. Engine outage, motor, frame, lines, wing material, or other component failure.",
  powerline_collision: "Contact with or near-miss of power lines. Often hard to see, especially in low light or when focused on landing.",
  midair_collision: "Collision or near-collision with another aircraft. Includes getting caught in wake turbulence from nearby traffic.",
  lines_brakes_issues: "Tangled lines, knotted brakes, or obstructions preventing proper wing control. Often discovered during launch or in flight.",
  water_landing: "Unplanned landing in water. Particularly dangerous due to weight of motor and entanglement risk.",
  preflight_error: "Issue that should have been caught during preflight check. Includes assembly errors, forgotten steps, or missed damage.",
  ground_starting: "Starting the paramotor's engine while the unit is on the ground, before strapping it onto the back.",
  ground_object_collision: "Impact with trees, buildings, vehicles, or other ground obstacles. Often during approach or emergency landing.",
  rain_fog_snow: "Flight in or into precipitation or low visibility conditions. Can affect wing performance, weight, and pilot visibility.",
  torque_twist: "Motor torque causes the lines to twist, leading to loss of control. The rotational force from the propeller can twist the suspension lines.",
  ground_handling: "Incidents during ground handling operations. Includes tripping while running, falling, crashing wing into propeller on ground, or other ground-level mishaps."
};

export const CAUSE_CONFIDENCE_HINTS = {
  maximum: "Exactly determined what happened. All facts are clear and verified.",
  high: "Very likely identified what happened. Strong evidence supports the conclusion.",
  low: "Not exactly known but plausible assumptions. Some uncertainty remains.",
  minimal: "Nothing is clear. Multiple possible explanations or very limited information."
};

export const SEVERITY_HINTS = {
  fatal: "Resulted in death of the pilot. The most severe outcome.",
  serious: "Pilot sustained significant injuries requiring medical attention, hospitalization, or long recovery time.",
  minor: "Pilot walked away unharmed or with only minor injuries like bruises or scratches."
};

export const POTENTIALLY_FATAL_HINT = "Could have resulted in death if circumstances were slightly different - such as occurring at lower altitude, unrecoverable collapse, reserve not open, hitting a harder surface, or pilot being less fortunate.";

export const CONTRIBUTING_FACTOR_HINTS = {
  factor_low_altitude: "Flying at insufficient height for recovery or reserve deployment. Reduces reaction time in emergencies.",
  factor_maneuvers: "Performing intentional flight maneuvers like spirals, wingovers, or acrobatic moves that increase risk.",
  factor_thermal_weather: "Flying in thermally active conditions with rising air columns that can cause turbulence and collapses.",
  factor_rain: "Flying in or encountering rain, which adds weight to the wing and can affect performance.",
  factor_rotor_turbulence: "Entering turbulent air behind obstacles like hills, buildings, or ridges where wind creates chaotic flow.",
  factor_wake_turbulence: "Turbulent air created by another aircraft passing nearby or ahead.",
  factor_wind_shear: "Sudden change in wind speed or direction over a short distance, causing abrupt wing loading changes.",
  factor_gust_front: "Leading edge of thunderstorm outflow with sudden, strong wind changes and possible downdrafts.",
  factor_reflex_profile: "Wing with reflex profile design, which affects handling characteristics and collapse resistance.",
  factor_helmet_missing: "Not wearing a helmet during flight, removing critical head protection.",
  factor_tree_collision: "Impact with or landing in trees, which can cause injury and equipment damage.",
  factor_water_landing: "Landing or falling into water, dangerous due to motor weight and entanglement risk.",
  factor_ground_starting: "Starting the engine while the paramotor is on the ground before strapping it on.",
  factor_powerline_collision: "Contact with or proximity to power lines, often difficult to see.",
  factor_turbulent_conditions: "General turbulent weather or air conditions making flight unstable.",
  factor_spiral_maneuver: "Intentional or unintentinoal performing a spiral maneuver.",
  factor_ground_object_collision: "Impact with ground-based obstacles like buildings, vehicles, or structures.",
  factor_released_brake_toggle: "Accidentally releasing or losing grip of a brake toggle during flight.",
  factor_wrongly_adjusted_trims: "Trimmers set incorrectly for conditions, affecting wing speed and handling.",
  factor_accidental_motor_kill: "Unintentionally stopping the engine during flight.",
  factor_wrong_throttle_management: "Incorrect use of throttle, such as too much or too little power for the situation.",
  factor_accidental_reserve_deployment: "Reserve parachute deploying unintentionally during flight.",
  factor_oscillations_out_of_control: "Wing pendulum or pitch oscillations exceeding pilot's ability to control.",
  factor_student_pilot: "Pilot in training or with limited experience.",
  factor_medical_issues: "Pilot experiencing health problems during flight, such as heart issues, seizure, or loss of consciousness.",
  factor_engine_failure: "Engine stops running during flight due to mechanical failure.",
  factor_trimmers_failure: "Trim system malfunction happened during flight.",
  factor_structural_failure: "Breakage of frame, carabiners, or other structural components.",
  factor_fire: "Fire occurring on the paramotor unit during flight.",
  factor_throttle_system_issues: "Problems with throttle cable, button, or control mechanism.",
  factor_paraglider_failure: "Wing material failure, tears, porosity issues, or structural damage to the paraglider."
};
