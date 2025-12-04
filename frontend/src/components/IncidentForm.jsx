import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchIncident, createIncident, updateIncident, chatWithAI } from '../api';

const FLIGHT_PHASES = [
  { value: '', label: 'Select...' },
  { value: 'takeoff', label: 'Takeoff' },
  { value: 'landing', label: 'Landing' },
  { value: 'flight', label: 'Flight' },
];

const SEVERITIES = [
  { value: '', label: 'Select...' },
  { value: 'fatal', label: 'Fatal' },
  { value: 'serious', label: 'Serious' },
  { value: 'minor', label: 'Minor' },
];

const RESERVE_USE = [
  { value: '', label: 'Select...' },
  { value: 'not_deployed', label: 'Not deployed' },
  { value: 'no_time', label: 'Did not have time to open' },
  { value: 'tangled', label: 'Became tangled' },
  { value: 'partially_opened', label: 'Partially opened' },
  { value: 'fully_opened', label: 'Fully opened' },
];

const CAUSE_CONFIDENCE = [
  { value: '', label: 'Select...' },
  { value: 'maximum', label: 'Maximum — exactly determined' },
  { value: 'high', label: 'High — very likely identified' },
  { value: 'low', label: 'Low — plausible assumptions' },
  { value: 'minimal', label: 'Minimal — nothing is clear' },
];

function IncidentForm() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(uuid);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    date: '',
    time: '',
    country: '',
    city_or_site: '',
    paramotor_frame: '',
    paramotor_engine: '',
    wing_manufacturer: '',
    wing_model: '',
    wing_size: '',
    pilot: '',
    flight_altitude: '',
    flight_phase: '',
    severity: '',
    potentially_fatal: false,
    description: '',
    causes_description: '',
    reserve_use: '',
    surface_type: '',
    cause_confidence: '',
    factor_low_altitude: false,
    factor_maneuvers: false,
    factor_accelerator: false,
    factor_thermal_weather: false,
    factor_rotor_turbulence: false,
    factor_trimmer_position: false,
    factor_reflex_profile: false,
    factor_helmet_worn: false,
    factor_tree_collision: false,
    factor_water_landing: false,
    source_links: '',
    media_links: '',
    wind_speed: '',
    meteorological_conditions: '',
    thermal_conditions: '',
  });

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (uuid) {
      fetchIncident(uuid).then(data => {
        setFormData({
          ...data,
          date: data.date || '',
          time: data.time || '',
          flight_altitude: data.flight_altitude || '',
        });
        setLoading(false);
      });
    }
  }, [uuid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const dataToSave = { ...formData };
    if (dataToSave.flight_altitude === '') {
      dataToSave.flight_altitude = null;
    }
    if (dataToSave.date === '') {
      dataToSave.date = null;
    }
    if (dataToSave.time === '') {
      dataToSave.time = null;
    }

    if (isEditing) {
      await updateIncident(uuid, dataToSave);
    } else {
      await createIncident(dataToSave);
    }
    navigate('/');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: inputMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setChatLoading(true);

    const result = await chatWithAI(newMessages, formData);
    
    const assistantMessage = { role: 'assistant', content: result.response };
    setMessages([...newMessages, assistantMessage]);

    if (result.incident_data) {
      setFormData(prev => {
        const updated = { ...prev };
        for (const [key, value] of Object.entries(result.incident_data)) {
          if (value !== null && value !== undefined) {
            updated[key] = value;
          }
        }
        return updated;
      });
    }

    setChatLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="font-display text-3xl text-gradient">
            {isEditing ? 'Edit Incident' : 'New Incident'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Panel - Left */}
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl flex flex-col h-[calc(100vh-180px)]">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                AI Assistant
              </h2>
              <p className="text-sm text-slate-500 mt-1">Describe the incident and I'll help fill the form</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🤖</div>
                  <p className="text-slate-400 text-sm">
                    Start by describing the incident.<br />
                    I'll extract the details for you.
                  </p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-orange-500/20 text-orange-100 rounded-br-md'
                        : 'bg-slate-700/50 text-slate-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50">
              <div className="flex gap-3 items-end">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Describe what happened... (Shift+Enter for new line)"
                  rows={3}
                  className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputMessage.trim()}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-medium text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-fit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Form Panel - Right */}
          <div className="h-[calc(100vh-180px)] overflow-y-auto pr-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Section title="Basic Information">
                <Input label="Title" name="title" value={formData.title} onChange={handleChange} />
                <Textarea label="Summary" name="summary" value={formData.summary} onChange={handleChange} rows={2} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date" name="date" type="date" value={formData.date} onChange={handleChange} />
                  <Input label="Time" name="time" type="time" value={formData.time} onChange={handleChange} />
                </div>
              </Section>

              {/* Location */}
              <Section title="Location">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Country" name="country" value={formData.country} onChange={handleChange} />
                  <Input label="City / Site" name="city_or_site" value={formData.city_or_site} onChange={handleChange} />
                </div>
              </Section>

              {/* Equipment */}
              <Section title="Equipment">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Paramotor Frame" name="paramotor_frame" value={formData.paramotor_frame} onChange={handleChange} />
                  <Input label="Paramotor Engine" name="paramotor_engine" value={formData.paramotor_engine} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Wing Manufacturer" name="wing_manufacturer" value={formData.wing_manufacturer} onChange={handleChange} />
                  <Input label="Wing Model" name="wing_model" value={formData.wing_model} onChange={handleChange} />
                  <Input label="Wing Size" name="wing_size" value={formData.wing_size} onChange={handleChange} />
                </div>
              </Section>

              {/* Pilot & Flight */}
              <Section title="Pilot & Flight">
                <Input label="Pilot" name="pilot" value={formData.pilot} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Flight Altitude (m)" name="flight_altitude" type="number" value={formData.flight_altitude} onChange={handleChange} />
                  <Select label="Flight Phase" name="flight_phase" value={formData.flight_phase} onChange={handleChange} options={FLIGHT_PHASES} />
                </div>
              </Section>

              {/* Incident Details */}
              <Section title="Incident Details">
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Severity" name="severity" value={formData.severity} onChange={handleChange} options={SEVERITIES} />
                  <Select label="Reserve Use" name="reserve_use" value={formData.reserve_use} onChange={handleChange} options={RESERVE_USE} />
                </div>
                <Checkbox label="Potentially fatal" name="potentially_fatal" checked={formData.potentially_fatal} onChange={handleChange} />
                <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} rows={4} />
                <Textarea label="Causes Description" name="causes_description" value={formData.causes_description} onChange={handleChange} rows={3} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Surface Type" name="surface_type" value={formData.surface_type} onChange={handleChange} placeholder="water / forest / rocks..." />
                  <Select label="Cause Confidence" name="cause_confidence" value={formData.cause_confidence} onChange={handleChange} options={CAUSE_CONFIDENCE} />
                </div>
              </Section>

              {/* Contributing Factors */}
              <Section title="Contributing Factors">
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox label="Low flight altitude" name="factor_low_altitude" checked={formData.factor_low_altitude} onChange={handleChange} />
                  <Checkbox label="Performed maneuvers" name="factor_maneuvers" checked={formData.factor_maneuvers} onChange={handleChange} />
                  <Checkbox label="Accelerator position" name="factor_accelerator" checked={formData.factor_accelerator} onChange={handleChange} />
                  <Checkbox label="Thermally active weather" name="factor_thermal_weather" checked={formData.factor_thermal_weather} onChange={handleChange} />
                  <Checkbox label="Entered rotor turbulence" name="factor_rotor_turbulence" checked={formData.factor_rotor_turbulence} onChange={handleChange} />
                  <Checkbox label="Trimmer position" name="factor_trimmer_position" checked={formData.factor_trimmer_position} onChange={handleChange} />
                  <Checkbox label="Reflex profile wing" name="factor_reflex_profile" checked={formData.factor_reflex_profile} onChange={handleChange} />
                  <Checkbox label="Helmet worn" name="factor_helmet_worn" checked={formData.factor_helmet_worn} onChange={handleChange} />
                  <Checkbox label="Tree collision/landing" name="factor_tree_collision" checked={formData.factor_tree_collision} onChange={handleChange} />
                  <Checkbox label="Water landing" name="factor_water_landing" checked={formData.factor_water_landing} onChange={handleChange} />
                </div>
              </Section>

              {/* Weather */}
              <Section title="Weather Conditions">
                <Input label="Wind Speed" name="wind_speed" value={formData.wind_speed} onChange={handleChange} placeholder="e.g., 10-15 km/h, gusts to 25" />
                <Textarea label="Meteorological Conditions" name="meteorological_conditions" value={formData.meteorological_conditions} onChange={handleChange} rows={2} />
                <Textarea label="Thermal Conditions" name="thermal_conditions" value={formData.thermal_conditions} onChange={handleChange} rows={2} />
              </Section>

              {/* Links */}
              <Section title="Links & Media">
                <Textarea label="Source Links (one per line)" name="source_links" value={formData.source_links} onChange={handleChange} rows={3} />
                <Textarea label="Media Links (one per line)" name="media_links" value={formData.media_links} onChange={handleChange} rows={3} />
              </Section>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4 pb-8">
                <Link
                  to="/"
                  className="px-6 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-700 transition-all"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Incident'}
                </button>
              </div>
            </form>
          </div>
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

function Input({ label, name, type = 'text', value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
      />
    </div>
  );
}

function Textarea({ label, name, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all resize-none"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Checkbox({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked || false}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className="w-4 h-4 bg-slate-900/50 border border-slate-600/50 rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all" />
        <svg
          className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
    </label>
  );
}

export default IncidentForm;
