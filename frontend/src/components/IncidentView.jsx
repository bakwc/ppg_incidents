import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchIncident } from '../api';

const COLLAPSE_LABELS = {
  asymmetric_small: 'Asymmetric collapse (<30%)',
  asymmetric_medium: 'Asymmetric collapse (30-50%)',
  asymmetric_large: 'Asymmetric collapse (>50%)',
  frontal: 'Frontal collapse',
  full_stall: 'Full stall',
  spin: 'Spin',
  line_twist: 'Line twist',
  cravatte: 'Cravatte',
  unknown: 'Unknown collapse',
};

const FLIGHT_PHASE_LABELS = {
  ground: 'Ground',
  takeoff: 'Takeoff',
  landing: 'Landing',
  flight: 'Flight',
};

const SEVERITY_LABELS = {
  fatal: 'Fatal',
  serious: 'Serious',
  minor: 'Minor',
};

const RESERVE_USE_LABELS = {
  not_installed: 'Not installed',
  not_deployed: 'Not deployed',
  no_time: 'Did not have time to open',
  tangled: 'Became tangled',
  partially_opened: 'Partially opened',
  fully_opened: 'Fully opened',
};

const CAUSE_CONFIDENCE_LABELS = {
  maximum: 'Maximum — exactly determined',
  high: 'High — very likely identified',
  low: 'Low — plausible assumptions',
  minimal: 'Minimal — nothing is clear',
};

const PARAMOTOR_TYPE_LABELS = {
  footlaunch: 'Footlaunch',
  trike: 'Trike',
};

const TRIMMER_LABELS = {
  closed: 'Closed',
  partially_open: 'Partially open',
  fully_open: 'Fully open',
};

const ACCELERATOR_LABELS = {
  not_used: 'Not used',
  released: 'Released',
  partially_engaged: 'Partially engaged',
  fully_engaged: 'Fully engaged',
};

const PILOT_ACTIONS_LABELS = {
  wrong_input_triggered: 'Wrong input triggered incident',
  mostly_wrong: 'Mostly wrong inputs while reacting',
  mixed: 'Some correct and some wrong inputs',
  mostly_correct: 'Mostly correct inputs while reacting',
};

const MID_AIR_COLLISION_LABELS = {
  fly_nearby: 'Fly nearby',
  got_in_wake_turbulence: 'Got in wake turbulence',
  almost_collided: 'Almost collided',
  collided: 'Collided',
};

const PRIMARY_CAUSE_LABELS = {
  turbulence: 'Turbulence',
  wrong_control_input: 'Wrong control input',
  hardware_failure: 'Hardware failure',
  powerline_collision: 'Powerline collision / Near Miss',
  midair_collision: 'Midair collision / Near Miss',
  lines_brakes_issues: 'Lines & Brakes Knots / Twists / Obstructions',
  water_landing: 'Water landing',
  preflight_error: 'Preflight Error',
  ground_starting: 'Ground Starting',
  ground_object_collision: 'Ground Object Collision / Near Miss',
  rain_fog_snow: 'Rain / Fog / Snow / Mist',
};

const severityColors = {
  fatal: 'bg-red-500/20 text-red-300 border-red-500/30',
  serious: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  minor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function IncidentView() {
  const { uuid } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncident(uuid).then(data => {
      setIncident(data);
      setLoading(false);
    });
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="font-display text-3xl text-gradient">
              Incident Details
            </h1>
          </div>
          <Link
            to={`/edit/${uuid}`}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </div>

        {/* Title & Badges */}
        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {incident.severity && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${severityColors[incident.severity]}`}>
                {incident.severity === 'fatal' ? '⚠️ ' : ''}{SEVERITY_LABELS[incident.severity] || incident.severity}
              </span>
            )}
            {incident.potentially_fatal && incident.severity !== 'fatal' && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold border bg-red-500/10 text-red-400 border-red-500/30">
                ⚠️ Potentially Fatal
              </span>
            )}
            {incident.flight_phase && (
              <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
                {FLIGHT_PHASE_LABELS[incident.flight_phase] || incident.flight_phase}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {incident.title || 'Untitled Incident'}
          </h2>
          {incident.summary && (
            <p className="text-slate-400">{incident.summary}</p>
          )}
        </div>

        <div className="space-y-6">
          {/* Incident Details */}
          {(incident.description || incident.causes_description || incident.primary_cause || incident.reserve_use || incident.surface_type || incident.cause_confidence || incident.pilot_actions || incident.injury_details) && (
            <Section title="Incident Details">
              <div className="grid grid-cols-2 gap-4">
                {incident.primary_cause && <Field label="Primary Cause" value={PRIMARY_CAUSE_LABELS[incident.primary_cause] || incident.primary_cause} />}
                {incident.cause_confidence && <Field label="Cause Confidence" value={CAUSE_CONFIDENCE_LABELS[incident.cause_confidence] || incident.cause_confidence} />}
              </div>
              {incident.description && <Field label="Description" value={incident.description} multiline />}
              {incident.causes_description && <Field label="Causes" value={incident.causes_description} multiline />}
              <div className="grid grid-cols-2 gap-4">
                {incident.reserve_use && <Field label="Reserve Use" value={RESERVE_USE_LABELS[incident.reserve_use] || incident.reserve_use} />}
                {incident.surface_type && <Field label="Surface Type" value={incident.surface_type} />}
                {incident.pilot_actions && <Field label="Pilot Actions" value={PILOT_ACTIONS_LABELS[incident.pilot_actions] || incident.pilot_actions} />}
              </div>
              {incident.injury_details && <Field label="Injury Details" value={incident.injury_details} multiline />}
            </Section>
          )}

          {/* Date & Location */}
          {(incident.date || incident.country || incident.city_or_site) && (
            <Section title="Date & Location">
              <div className="grid grid-cols-2 gap-4">
                {incident.date && (
                  <Field label="Date" value={new Date(incident.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} />
                )}
                {incident.time && <Field label="Time" value={incident.time} />}
                {incident.country && <Field label="Country" value={incident.country} />}
                {incident.city_or_site && <Field label="City / Site" value={incident.city_or_site} />}
              </div>
            </Section>
          )}

          {/* Equipment */}
          {(incident.paramotor_type || incident.paramotor_frame || incident.paramotor_engine || incident.wing_manufacturer || incident.wing_model || incident.wing_size) && (
            <Section title="Equipment">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {incident.paramotor_type && <Field label="Paramotor Type" value={PARAMOTOR_TYPE_LABELS[incident.paramotor_type] || incident.paramotor_type} />}
                {incident.paramotor_frame && <Field label="Frame" value={incident.paramotor_frame} />}
                {incident.paramotor_engine && <Field label="Engine" value={incident.paramotor_engine} />}
                {incident.wing_manufacturer && <Field label="Wing Manufacturer" value={incident.wing_manufacturer} />}
                {incident.wing_model && <Field label="Wing Model" value={incident.wing_model} />}
                {incident.wing_size && <Field label="Wing Size" value={incident.wing_size} />}
              </div>
            </Section>
          )}

          {/* Pilot & Flight */}
          {(incident.pilot_name || incident.pilot_details || incident.flight_altitude) && (
            <Section title="Pilot & Flight">
              <div className="grid grid-cols-2 gap-4">
                {incident.pilot_name && <Field label="Pilot Name" value={incident.pilot_name} />}
                {incident.flight_altitude && <Field label="Altitude" value={`${incident.flight_altitude} m`} />}
              </div>
              {incident.pilot_details && <Field label="Pilot Details" value={incident.pilot_details} />}
            </Section>
          )}

          {/* Hardware */}
          {(incident.hardware_failure || incident.bad_hardware_preflight) && (
            <Section title="Hardware">
              <div className="flex flex-wrap gap-3">
                {incident.hardware_failure && <Badge label="Hardware failure occurred" />}
                {incident.bad_hardware_preflight && <Badge label="Issue could be found on preflight" />}
              </div>
            </Section>
          )}

          {/* Collapse Sequence */}
          {incident.collapse_types && incident.collapse_types.length > 0 && (
            <Section title="Collapse Sequence">
              <div className="flex flex-wrap gap-2">
                {incident.collapse_types.map((type, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg"
                  >
                    <span className="text-xs text-orange-400 font-medium">{idx + 1}.</span>
                    <span className="text-sm text-slate-200">{COLLAPSE_LABELS[type] || type}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Contributing Factors */}
          {(incident.factor_trimmer_position || incident.factor_accelerator || incident.factor_mid_air_collision || incident.factor_low_altitude || incident.factor_maneuvers || incident.factor_thermal_weather || incident.factor_rain || incident.factor_rotor_turbulence || incident.factor_wake_turbulence || incident.factor_reflex_profile || incident.factor_helmet_missing || incident.factor_tree_collision || incident.factor_water_landing || incident.factor_ground_starting || incident.factor_powerline_collision || incident.factor_turbulent_conditions || incident.factor_spiral_maneuver || incident.factor_ground_object_collision) && (
            <Section title="Contributing Factors">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {incident.factor_trimmer_position && <Field label="Trimmer Position" value={TRIMMER_LABELS[incident.factor_trimmer_position] || incident.factor_trimmer_position} />}
                {incident.factor_accelerator && <Field label="Accelerator" value={ACCELERATOR_LABELS[incident.factor_accelerator] || incident.factor_accelerator} />}
                {incident.factor_mid_air_collision && <Field label="Mid-air Collision" value={MID_AIR_COLLISION_LABELS[incident.factor_mid_air_collision] || incident.factor_mid_air_collision} />}
              </div>
              <div className="flex flex-wrap gap-2">
                {incident.factor_low_altitude && <Badge label="Low flight altitude" />}
                {incident.factor_maneuvers && <Badge label="Performed maneuvers" />}
                {incident.factor_thermal_weather && <Badge label="Thermally active weather" />}
                {incident.factor_rain && <Badge label="Rain" />}
                {incident.factor_rotor_turbulence && <Badge label="Entered rotor turbulence" />}
                {incident.factor_wake_turbulence && <Badge label="Wake turbulence" />}
                {incident.factor_reflex_profile && <Badge label="Reflex profile wing" />}
                {incident.factor_helmet_missing && <Badge label="Helmet missing" />}
                {incident.factor_tree_collision && <Badge label="Tree collision/landing" />}
                {incident.factor_water_landing && <Badge label="Water landing" />}
                {incident.factor_ground_starting && <Badge label="Ground starting" />}
                {incident.factor_powerline_collision && <Badge label="Powerline collision" />}
                {incident.factor_turbulent_conditions && <Badge label="Turbulent conditions" />}
                {incident.factor_spiral_maneuver && <Badge label="Spiral maneuver" />}
                {incident.factor_ground_object_collision && <Badge label="Ground object collision" />}
              </div>
            </Section>
          )}

          {/* Weather */}
          {(incident.wind_speed || incident.wind_speed_ms || incident.meteorological_conditions || incident.thermal_conditions) && (
            <Section title="Weather Conditions">
              {incident.wind_speed_ms && <Field label="Wind Speed" value={`${incident.wind_speed_ms} m/s`} />}
              {incident.wind_speed && <Field label="Wind Description" value={incident.wind_speed} />}
              {incident.meteorological_conditions && <Field label="Meteorological Conditions" value={incident.meteorological_conditions} multiline />}
              {incident.thermal_conditions && <Field label="Thermal Conditions" value={incident.thermal_conditions} multiline />}
            </Section>
          )}

          {/* Links & Media */}
          {(incident.source_links || incident.media_links || incident.report_raw) && (
            <Section title="Links & Media">
              {incident.source_links && <LinksField label="Source Links" value={incident.source_links} />}
              {incident.media_links && <LinksField label="Media Links" value={incident.media_links} />}
              {incident.report_raw && <Field label="Raw Report / Analysis" value={incident.report_raw} multiline />}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
      <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
        {title}
      </h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, multiline }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {multiline ? (
        <p className="text-slate-200 text-sm whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-slate-200 text-sm">{value}</p>
      )}
    </div>
  );
}

function Badge({ label }) {
  return (
    <span className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-300">
      {label}
    </span>
  );
}

function LinksField({ label, value }) {
  const links = value.split('\n').filter(l => l.trim());
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="space-y-1">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-orange-400 hover:text-orange-300 hover:underline truncate"
          >
            {link.trim()}
          </a>
        ))}
      </div>
    </div>
  );
}

export default IncidentView;

