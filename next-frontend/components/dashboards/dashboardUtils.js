export const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#6366f1'];

export const getBaseFilter = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = {};
  
  if (confidenceFilter === 'high') {
    baseFilter.cause_confidence = 'maximum,high';
  }
  
  if (severityFilter === 'potentially_fatal') {
    baseFilter.potentially_fatal = true;
  } else if (severityFilter === 'fatal') {
    baseFilter.severity = 'fatal';
  }
  
  if (typeof yearFilter === 'object' && yearFilter !== null) {
    if (yearFilter.from) {
      baseFilter.year_min = parseInt(yearFilter.from);
    }
    if (yearFilter.to) {
      baseFilter.year_max = parseInt(yearFilter.to);
    }
  } else if (yearFilter === 'last_10_years') {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;
    baseFilter.year_min = startYear;
  } else if (yearFilter === 'last_5_years') {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    baseFilter.year_min = startYear;
  }
  
  return baseFilter;
};

export const getPieFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Wrong Control Input',
    include: { ...baseFilter, primary_cause: 'wrong_control_input' },
    exclude: {}
  },
  {
    name: 'Hardware Failure',
    include: { ...baseFilter, primary_cause: 'hardware_failure' },
    exclude: {}
  },
  {
    name: 'Turbulence',
    include: { ...baseFilter, primary_cause: 'turbulence' },
    exclude: {}
  },
  {
    name: 'Powerline Collision / Near Miss',
    include: { ...baseFilter, primary_cause: 'powerline_collision' },
    exclude: {}
  },
  {
    name: 'Midair Collision / Near Miss',
    include: { ...baseFilter, primary_cause: 'midair_collision' },
    exclude: {}
  },
  {
    name: 'Water Landing',
    include: { ...baseFilter, primary_cause: 'water_landing' },
    exclude: {}
  },
  {
    name: 'Lines & Brakes Issues',
    include: { ...baseFilter, primary_cause: 'lines_brakes_issues' },
    exclude: {}
  },
  {
    name: 'Ground Starting',
    include: { ...baseFilter, primary_cause: 'ground_starting' },
    exclude: {}
  },
  {
    name: 'Ground Object Collision',
    include: { ...baseFilter, primary_cause: 'ground_object_collision' },
    exclude: {}
  },
  {
    name: 'Preflight Error',
    include: { ...baseFilter, primary_cause: 'preflight_error' },
    exclude: {}
  },
  {
    name: 'Torque Twist',
    include: { ...baseFilter, primary_cause: 'torque_twist' },
    exclude: {}
  },
  {
    name: 'Ground Handling',
    include: { ...baseFilter, primary_cause: 'ground_handling' },
    exclude: {}
  },
  {
    name: 'Others / Unknown',
    include: { ...baseFilter },
    exclude: { primary_cause: 'wrong_control_input,hardware_failure,turbulence,powerline_collision,midair_collision,water_landing,lines_brakes_issues,ground_starting,ground_object_collision,preflight_error,rain_fog_snow,torque_twist,ground_handling' }
  }
];
};

export const getBarFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Wrong Pilot Input',
    include: { ...baseFilter, pilot_actions: 'wrong_input_triggered' },
    exclude: {}
  },
  {
    name: 'Hardware Failure',
    include: { ...baseFilter, hardware_failure: true },
    exclude: { }
  },
  {
    name: 'Turbulent Conditions',
    include: { ...baseFilter, factor_turbulent_conditions: true },
  },
  {
    name: 'Powerline Collision',
    include: { ...baseFilter, factor_powerline_collision: true }
  },
  {
    name: 'Low Acro',
    include: { ...baseFilter, factor_low_altitude: true, factor_maneuvers: true }
  },
  {
    name: 'Performed Maneuvers',
    include: { ...baseFilter, factor_maneuvers: true }
  },
  {
    name: 'Water Landing',
    include: { ...baseFilter, factor_water_landing: true }
  },
  {
    name: 'Wing Collapse',
    include: { ...baseFilter, collapse: true }
  },
  {
    name: 'Spiral',
    include: { ...baseFilter, factor_spiral_maneuver: true }
  },
  {
    name: 'Accelerator Engaged',
    include: { ...baseFilter, factor_accelerator: 'partially_engaged,fully_engaged' }
  }
];
};

export const getWrongControlInputFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, primary_cause: 'wrong_control_input' },
    exclude: {}
  },
  {
    name: 'Active Maneuvers',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_maneuvers: true },
    exclude: {}
  },
  {
    name: 'Stall Induced',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', stall: true },
    exclude: {}
  },
  {
    name: 'Line Twist',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', line_twist: true },
    exclude: {}
  },
  {
    name: 'Brake Toggle Lost / Released',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_released_brake_toggle: true },
    exclude: {}
  },
  {
    name: 'Wrongly Adjusted Trims',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_wrongly_adjusted_trims: true },
    exclude: {}
  },
  {
    name: 'Accidental Reserve Deployment',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_accidental_reserve_deployment: true },
    exclude: {}
  },
  {
    name: 'Accidental Motor Kill',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_accidental_motor_kill: true },
    exclude: {}
  },
  {
    name: 'Student Pilot',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_student_pilot: true },
    exclude: {}
  },
  {
    name: 'Wrong Throttle Management',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_wrong_throttle_management: true },
    exclude: {}
  },
  {
    name: 'Oscillations Out of Control',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_oscillations_out_of_control: true },
    exclude: {}
  },
  {
    name: 'Medical Issues',
    include: { ...baseFilter, primary_cause: 'wrong_control_input', factor_medical_issues: true },
    exclude: {}
  },
  {
    name: 'Others',
    include: { ...baseFilter, primary_cause: 'wrong_control_input' },
    exclude: { factor_maneuvers: true, stall: true, line_twist: true, factor_released_brake_toggle: true, factor_wrongly_adjusted_trims: true, factor_accidental_reserve_deployment: true, factor_accidental_motor_kill: true, factor_student_pilot: true, factor_wrong_throttle_management: true, factor_oscillations_out_of_control: true, factor_medical_issues: true }
  }
];
};

export const getHardwareFailureFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, primary_cause: 'hardware_failure' },
    exclude: {}
  },
  {
    name: 'Engine Failure',
    include: { ...baseFilter, primary_cause: 'hardware_failure', factor_engine_failure: true },
    exclude: {}
  },
  {
    name: 'Trimmers Failure',
    include: { ...baseFilter, primary_cause: 'hardware_failure', factor_trimmers_failure: true },
    exclude: {}
  },
  {
    name: 'Structural Failure',
    include: { ...baseFilter, primary_cause: 'hardware_failure', factor_structural_failure: true },
    exclude: {}
  },
  {
    name: 'Fire',
    include: { ...baseFilter, primary_cause: 'hardware_failure', factor_fire: true },
    exclude: {}
  },
  {
    name: 'Throttle System Issues',
    include: { ...baseFilter, primary_cause: 'hardware_failure', factor_throttle_system_issues: true },
    exclude: {}
  },
  {
    name: 'Paraglider Failure',
    include: { ...baseFilter, primary_cause: 'hardware_failure', factor_paraglider_failure: true },
    exclude: {}
  },
  {
    name: 'Others',
    include: { ...baseFilter, primary_cause: 'hardware_failure' },
    exclude: { factor_engine_failure: true, factor_trimmers_failure: true, factor_structural_failure: true, factor_fire: true, factor_throttle_system_issues: true, factor_paraglider_failure: true }
  }
];
};

export const getFlightPhaseFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Ground',
    include: { ...baseFilter, flight_phase: 'ground' },
    exclude: {}
  },
  {
    name: 'Takeoff',
    include: { ...baseFilter, flight_phase: 'takeoff' },
    exclude: {}
  },
  {
    name: 'Flight',
    include: { ...baseFilter, flight_phase: 'flight' },
    exclude: {}
  },
  {
    name: 'Landing',
    include: { ...baseFilter, flight_phase: 'landing' },
    exclude: {}
  }
];
};

export const getAltitudeFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, altitude_not_null: true },
    exclude: {}
  },
  {
    name: '0-15',
    include: { ...baseFilter, altitude_min: 0, altitude_max: 15 },
    exclude: {}
  },
  {
    name: '15-50',
    include: { ...baseFilter, altitude_min: 15, altitude_max: 50 },
    exclude: {}
  },
  {
    name: '50-100',
    include: { ...baseFilter, altitude_min: 50, altitude_max: 100 },
    exclude: {}
  },
  {
    name: '100-200',
    include: { ...baseFilter, altitude_min: 100, altitude_max: 200 },
    exclude: {}
  },
  {
    name: '200-500',
    include: { ...baseFilter, altitude_min: 200, altitude_max: 500 },
    exclude: {}
  },
  {
    name: '500+',
    include: { ...baseFilter, altitude_min: 500},
    exclude: {}
  },
];
};

export const getTurbulenceFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, factor_turbulent_conditions: true },
    exclude: {}
  },
  {
    name: 'Rotor',
    include: { ...baseFilter, factor_turbulent_conditions: true, factor_rotor_turbulence: true },
    exclude: {}
  },
  {
    name: 'Thermal Activity',
    include: { ...baseFilter, factor_turbulent_conditions: true, factor_thermal_weather: true },
    exclude: {}
  },
  {
    name: 'Wind Shear',
    include: { ...baseFilter, factor_turbulent_conditions: true, factor_wind_shear: true },
    exclude: {}
  },
  {
    name: 'Gust Front',
    include: { ...baseFilter, factor_turbulent_conditions: true, factor_gust_front: true },
    exclude: {}
  },
  {
    name: 'Wake Turbulence',
    include: { ...baseFilter, factor_turbulent_conditions: true, factor_wake_turbulence: true },
    exclude: {}
  },
  {
    name: 'Unknown',
    include: { ...baseFilter, factor_turbulent_conditions: true },
    exclude: { factor_rotor_turbulence: true, factor_thermal_weather: true, factor_wind_shear: true, factor_gust_front: true, factor_wake_turbulence: true }
  }
];
};

export const getWindSpeedFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, wind_speed_ms_not_null: true },
    exclude: {}
  },
  {
    name: '0-1',
    include: { ...baseFilter, wind_speed_ms_max: 1 },
    exclude: {}
  },
  {
    name: '1-2',
    include: { ...baseFilter, wind_speed_ms_min: 1, wind_speed_ms_max: 2 },
    exclude: {}
  },
  {
    name: '2-3',
    include: { ...baseFilter, wind_speed_ms_min: 2, wind_speed_ms_max: 3 },
    exclude: {}
  },
  {
    name: '3-4',
    include: { ...baseFilter, wind_speed_ms_min: 3, wind_speed_ms_max: 4 },
    exclude: {}
  },
  {
    name: '4-6',
    include: { ...baseFilter, wind_speed_ms_min: 4, wind_speed_ms_max: 6 },
    exclude: {}
  },
  {
    name: '6-8',
    include: { ...baseFilter, wind_speed_ms_min: 6, wind_speed_ms_max: 8 },
    exclude: {}
  },
  {
    name: '8+',
    include: { ...baseFilter, wind_speed_ms_min: 8 },
    exclude: {}
  }
];
};

export const getReserveFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'Attempted',
    include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened,fully_opened' },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'FullyOpened',
    include: { ...baseFilter, reserve_use: 'fully_opened' },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'NotOpened',
    include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened' },
    exclude: { flight_phase: 'ground' }
  }
];
};

export const getTrimFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Unknown',
    include: { ...baseFilter, factor_trimmer_position: 'null' },
    exclude: {}
  },
  {
    name: 'TrimOut',
    include: { ...baseFilter, factor_trimmer_position: 'fully_open' },
    exclude: {}
  },
  {
    name: 'PartiallyOpen',
    include: { ...baseFilter, factor_trimmer_position: 'partially_open' },
    exclude: {}
  },
  {
    name: 'TrimIn',
    include: { ...baseFilter, factor_trimmer_position: 'closed' },
    exclude: {}
  }
];
};

export const getSurvivabilityFilterPacks = (yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter('all', yearFilter, confidenceFilter);
  return [
  {
    name: 'Powerline Hit',
    include: { ...baseFilter, factor_powerline_collision: true },
    exclude: {}
  },
  {
    name: 'Tree Hit',
    include: { ...baseFilter, factor_tree_collision: true },
    exclude: {}
  },
  {
    name: 'Reserve Toss',
    include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened,fully_opened' },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'Engine Failure',
    include: { ...baseFilter, factor_engine_failure: true },
    exclude: {}
  },
  {
    name: 'Water Landing',
    include: { ...baseFilter, factor_water_landing: true },
    exclude: {}
  }
];
};

export const getSurvivabilityFatalFilterPacks = (yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter('fatal', yearFilter, confidenceFilter);
  return [
  {
    name: 'Powerline Hit',
    include: { ...baseFilter, factor_powerline_collision: true },
    exclude: {}
  },
  {
    name: 'Tree Hit',
    include: { ...baseFilter, factor_tree_collision: true },
    exclude: {}
  },
  {
    name: 'Reserve Toss',
    include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened,fully_opened' },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'Engine Failure',
    include: { ...baseFilter, factor_engine_failure: true },
    exclude: {}
  },
  {
    name: 'Water Landing',
    include: { ...baseFilter, factor_water_landing: true },
    exclude: {}
  }
];
};

export const getPrimaryCauseTrendFilterPacks = (severityFilter, confidenceFilter) => {
  const currentYear = new Date().getFullYear();
  const baseFilterMaker = (yearMin, yearMax) => {
    const base = getBaseFilter(severityFilter, 'all_time', confidenceFilter);
    delete base.year_min;
    base.year_min = yearMin;
    base.year_max = yearMax;
    return base;
  };
  
  return [
    {
      name: `${currentYear - 4}-${currentYear}`,
      periods: [
        { 
          cause: 'Wrong Control Input',
          include: { ...baseFilterMaker(currentYear - 4, currentYear), primary_cause: 'wrong_control_input' },
          exclude: {}
        },
        {
          cause: 'Turbulence',
          include: { ...baseFilterMaker(currentYear - 4, currentYear), primary_cause: 'turbulence' },
          exclude: {}
        },
        {
          cause: 'Hardware Failure',
          include: { ...baseFilterMaker(currentYear - 4, currentYear), primary_cause: 'hardware_failure' },
          exclude: {}
        },
        {
          cause: 'Ground Starting',
          include: { ...baseFilterMaker(currentYear - 4, currentYear), primary_cause: 'ground_starting' },
          exclude: {}
        },
        {
          cause: 'Powerline Collision',
          include: { ...baseFilterMaker(currentYear - 4, currentYear), primary_cause: 'powerline_collision' },
          exclude: {}
        },
        {
          cause: 'Other',
          include: { ...baseFilterMaker(currentYear - 4, currentYear) },
          exclude: { primary_cause: 'wrong_control_input,turbulence,hardware_failure,ground_starting,powerline_collision,torque_twist,ground_handling' }
        }
      ]
    },
    {
      name: `${currentYear - 9}-${currentYear - 5}`,
      periods: [
        {
          cause: 'Wrong Control Input',
          include: { ...baseFilterMaker(currentYear - 9, currentYear - 5), primary_cause: 'wrong_control_input' },
          exclude: {}
        },
        {
          cause: 'Turbulence',
          include: { ...baseFilterMaker(currentYear - 9, currentYear - 5), primary_cause: 'turbulence' },
          exclude: {}
        },
        {
          cause: 'Hardware Failure',
          include: { ...baseFilterMaker(currentYear - 9, currentYear - 5), primary_cause: 'hardware_failure' },
          exclude: {}
        },
        {
          cause: 'Ground Starting',
          include: { ...baseFilterMaker(currentYear - 9, currentYear - 5), primary_cause: 'ground_starting' },
          exclude: {}
        },
        {
          cause: 'Powerline Collision',
          include: { ...baseFilterMaker(currentYear - 9, currentYear - 5), primary_cause: 'powerline_collision' },
          exclude: {}
        },
        {
          cause: 'Other',
          include: { ...baseFilterMaker(currentYear - 9, currentYear - 5) },
          exclude: { primary_cause: 'wrong_control_input,turbulence,hardware_failure,ground_starting,powerline_collision,torque_twist,ground_handling' }
        }
      ]
    },
    {
      name: `${currentYear - 14}-${currentYear - 10}`,
      periods: [
        {
          cause: 'Wrong Control Input',
          include: { ...baseFilterMaker(currentYear - 14, currentYear - 10), primary_cause: 'wrong_control_input' },
          exclude: {}
        },
        {
          cause: 'Turbulence',
          include: { ...baseFilterMaker(currentYear - 14, currentYear - 10), primary_cause: 'turbulence' },
          exclude: {}
        },
        {
          cause: 'Hardware Failure',
          include: { ...baseFilterMaker(currentYear - 14, currentYear - 10), primary_cause: 'hardware_failure' },
          exclude: {}
        },
        {
          cause: 'Ground Starting',
          include: { ...baseFilterMaker(currentYear - 14, currentYear - 10), primary_cause: 'ground_starting' },
          exclude: {}
        },
        {
          cause: 'Powerline Collision',
          include: { ...baseFilterMaker(currentYear - 14, currentYear - 10), primary_cause: 'powerline_collision' },
          exclude: {}
        },
        {
          cause: 'Other',
          include: { ...baseFilterMaker(currentYear - 14, currentYear - 10) },
          exclude: { primary_cause: 'wrong_control_input,turbulence,hardware_failure,ground_starting,powerline_collision,torque_twist,ground_handling' }
        }
      ]
    },
    {
      name: `${currentYear - 19}-${currentYear - 15}`,
      periods: [
        {
          cause: 'Wrong Control Input',
          include: { ...baseFilterMaker(currentYear - 19, currentYear - 15), primary_cause: 'wrong_control_input' },
          exclude: {}
        },
        {
          cause: 'Turbulence',
          include: { ...baseFilterMaker(currentYear - 19, currentYear - 15), primary_cause: 'turbulence' },
          exclude: {}
        },
        {
          cause: 'Hardware Failure',
          include: { ...baseFilterMaker(currentYear - 19, currentYear - 15), primary_cause: 'hardware_failure' },
          exclude: {}
        },
        {
          cause: 'Ground Starting',
          include: { ...baseFilterMaker(currentYear - 19, currentYear - 15), primary_cause: 'ground_starting' },
          exclude: {}
        },
        {
          cause: 'Powerline Collision',
          include: { ...baseFilterMaker(currentYear - 19, currentYear - 15), primary_cause: 'powerline_collision' },
          exclude: {}
        },
        {
          cause: 'Other',
          include: { ...baseFilterMaker(currentYear - 19, currentYear - 15) },
          exclude: { primary_cause: 'wrong_control_input,turbulence,hardware_failure,ground_starting,powerline_collision,torque_twist,ground_handling' }
        }
      ]
    }
  ];
};

export const buildFilterUrl = (filterPack) => {
  const params = new URLSearchParams();
  Object.entries(filterPack.include || {}).forEach(([key, value]) => {
    params.set(key, value);
  });
  Object.entries(filterPack.exclude || {}).forEach(([key, value]) => {
    params.set(`exclude_${key}`, value);
  });
  return `/incidents?${params.toString()}`;
};

