import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchIncident, createIncident, updateIncident, chatWithAI, checkDuplicate, deleteIncident } from '../api';

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

const COLLAPSE_TYPES = [
  { value: 'asymmetric_small', label: 'Asymmetric collapse (<30%)' },
  { value: 'asymmetric_medium', label: 'Asymmetric collapse (30-50%)' },
  { value: 'asymmetric_large', label: 'Asymmetric collapse (>50%)' },
  { value: 'frontal', label: 'Frontal collapse' },
  { value: 'full_stall', label: 'Full stall' },
  { value: 'spin', label: 'Spin' },
  { value: 'line_twist', label: 'Line twist' },
  { value: 'cravatte', label: 'Cravatte' },
];

const PARAMOTOR_TYPES = [
  { value: '', label: 'Select...' },
  { value: 'footlaunch', label: 'Footlaunch' },
  { value: 'trike', label: 'Trike' },
];

const TRIMMER_POSITIONS = [
  { value: '', label: 'Select...' },
  { value: 'closed', label: 'Closed' },
  { value: 'partially_open', label: 'Partially open' },
  { value: 'fully_open', label: 'Fully open' },
];

const ACCELERATOR_POSITIONS = [
  { value: '', label: 'Select...' },
  { value: 'released', label: 'Released' },
  { value: 'partially_engaged', label: 'Partially engaged' },
  { value: 'fully_engaged', label: 'Fully engaged' },
];

const PILOT_ACTIONS = [
  { value: '', label: 'Select...' },
  { value: 'wrong_input_triggered', label: 'Wrong input triggered incident' },
  { value: 'mostly_wrong', label: 'Mostly wrong inputs while reacting' },
  { value: 'mixed', label: 'Some correct and some wrong inputs' },
  { value: 'mostly_correct', label: 'Mostly correct inputs while reacting' },
];

const MID_AIR_COLLISION = [
  { value: '', label: 'Select...' },
  { value: 'fly_nearby', label: 'Fly nearby' },
  { value: 'got_in_wake_turbulence', label: 'Got in wake turbulence' },
  { value: 'almost_collided', label: 'Almost collided' },
  { value: 'collided', label: 'Collided' },
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
    paramotor_type: '',
    paramotor_frame: '',
    paramotor_engine: '',
    wing_manufacturer: '',
    wing_model: '',
    wing_size: '',
    pilot_name: '',
    pilot_details: '',
    flight_altitude: '',
    flight_phase: '',
    severity: '',
    potentially_fatal: false,
    description: '',
    causes_description: '',
    reserve_use: '',
    surface_type: '',
    cause_confidence: '',
    pilot_actions: '',
    injury_details: '',
    hardware_failure: false,
    bad_hardware_preflight: false,
    factor_low_altitude: false,
    factor_maneuvers: false,
    factor_accelerator: '',
    factor_thermal_weather: false,
    factor_rotor_turbulence: false,
    factor_trimmer_position: '',
    factor_reflex_profile: false,
    factor_helmet_missing: false,
    factor_tree_collision: false,
    factor_water_landing: false,
    factor_ground_starting: false,
    factor_powerline_collision: false,
    factor_turbulent_conditions: false,
    factor_spiral_maneuver: false,
    factor_mid_air_collision: '',
    source_links: '',
    media_links: '',
    report_raw: '',
    wind_speed: '',
    meteorological_conditions: '',
    thermal_conditions: '',
    collapse_types: [],
    verified: false,
  });

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState(new Set());
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (uuid) {
      fetchIncident(uuid).then(data => {
        setFormData({
          ...data,
          date: data.date || '',
          time: data.time || '',
          flight_altitude: data.flight_altitude || '',
          collapse_types: data.collapse_types || [],
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

  const addCollapseType = (collapseType) => {
    if (!collapseType) return;
    setFormData(prev => ({
      ...prev,
      collapse_types: [...(prev.collapse_types || []), collapseType],
    }));
  };

  const removeCollapseType = (index) => {
    setFormData(prev => ({
      ...prev,
      collapse_types: prev.collapse_types.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e, verified) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setHighlightedFields(new Set());

    const dataToSave = { ...formData, verified };
    if (dataToSave.flight_altitude === '') {
      dataToSave.flight_altitude = null;
    }
    if (dataToSave.date === '') {
      dataToSave.date = null;
    }
    if (dataToSave.time === '') {
      dataToSave.time = null;
    }
    // Convert empty choice fields to null
    const choiceFields = [
      'factor_accelerator', 'factor_trimmer_position', 'pilot_actions',
      'flight_phase', 'severity', 'reserve_use', 'cause_confidence', 'paramotor_type',
      'factor_mid_air_collision'
    ];
    for (const field of choiceFields) {
      if (dataToSave[field] === '') {
        dataToSave[field] = null;
      }
    }

    try {
      if (isEditing) {
        await updateIncident(uuid, dataToSave);
        setFormData(prev => ({ ...prev, verified }));
        setSaveSuccess(true);
      } else {
        const result = await createIncident(dataToSave);
        navigate(`/edit/${result.incident.uuid}`);
      }
    } catch (error) {
      setSaveError(error.message);
    }
    setSaving(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    setHighlightedFields(new Set());
    
    const userMessage = { role: 'user', content: inputMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setChatLoading(true);

    const result = await chatWithAI(newMessages, formData);
    
    // Use the full message history returned from backend (includes tool calls)
    if (result.messages) {
      setMessages(result.messages);
    } else {
      // Fallback if messages not returned
      const assistantMessage = { role: 'assistant', content: result.response };
      setMessages([...newMessages, assistantMessage]);
    }

    if (result.incident_data) {
      const changedFields = new Set();
      
      for (const [key, value] of Object.entries(result.incident_data)) {
        if (value !== null && value !== undefined) {
          const oldValue = formData[key];
          const valuesEqual = Array.isArray(value) && Array.isArray(oldValue)
            ? JSON.stringify(value) === JSON.stringify(oldValue)
            : value === oldValue;
          
          if (!valuesEqual) {
            changedFields.add(key);
          }
        }
      }

      if (changedFields.size > 0) {
        setFormData(prev => {
          const updated = { ...prev };
          for (const key of changedFields) {
            updated[key] = result.incident_data[key];
          }
          return updated;
        });
        
        setHighlightedFields(changedFields);
      }
    }

    setChatLoading(false);
  };

  const handleCheckDuplicates = async () => {
    setDuplicateLoading(true);
    setDuplicateResult(null);
    const result = await checkDuplicate(formData, isEditing ? uuid : null);
    setDuplicateResult(result);
    setDuplicateLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this incident?')) return;
    setDeleting(true);
    await deleteIncident(uuid);
    navigate('/');
  };

  const getVerdictInfo = (confidence) => {
    switch (confidence) {
      case 'High':
        return { text: 'Duplicate', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' };
      case 'Medium':
        return { text: 'Probably Duplicate', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' };
      case 'Low':
        return { text: 'Probably not a duplicate', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' };
      default:
        return { text: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' };
    }
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
              {messages.map((msg, idx) => {
                // Handle tool_result messages (from Anthropic format)
                if (msg.role === 'user' && Array.isArray(msg.content) && msg.content[0]?.type === 'tool_result') {
                  return msg.content.map((toolResult, tIdx) => (
                    <ToolResultMessage key={`${idx}-${tIdx}`} content={toolResult.content} />
                  ));
                }
                // Handle assistant messages with tool_use (from Anthropic format)
                if (msg.role === 'assistant' && Array.isArray(msg.content)) {
                  return msg.content.map((block, bIdx) => {
                    if (block.type === 'tool_use') {
                      return <ToolUseMessage key={`${idx}-${bIdx}`} name={block.name} input={block.input} />;
                    }
                    if (block.type === 'text') {
                      let displayText = block.text;
                      let jsonText = block.text;
                      // Strip markdown code block markers if present
                      if (jsonText.includes('```json')) {
                        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
                      } else if (jsonText.includes('```')) {
                        jsonText = jsonText.split('```')[1].split('```')[0].trim();
                      }
                      try {
                        const parsed = JSON.parse(jsonText);
                        if (parsed.response) {
                          displayText = parsed.response;
                        }
                      } catch {
                        // Not JSON, use as-is
                      }
                      return (
                        <div key={`${idx}-${bIdx}`} className="flex justify-start">
                          <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-slate-700/50 text-slate-200 rounded-bl-md">
                            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  });
                }
                // Handle tool messages (from OpenAI format)
                if (msg.role === 'tool') {
                  return <ToolResultMessage key={idx} content={msg.content} />;
                }
                // Handle assistant with tool_calls (from OpenAI format)
                if (msg.role === 'assistant' && msg.tool_calls) {
                  return msg.tool_calls.map((tc, tIdx) => (
                    <ToolUseMessage key={`${idx}-${tIdx}`} name={tc.function.name} input={JSON.parse(tc.function.arguments)} />
                  ));
                }
                // Regular user/assistant messages
                let displayContent = msg.content;
                // For assistant messages, try to extract just the "response" field from JSON
                if (msg.role === 'assistant' && typeof msg.content === 'string') {
                  let jsonText = msg.content;
                  // Strip markdown code block markers if present
                  if (jsonText.includes('```json')) {
                    jsonText = jsonText.split('```json')[1].split('```')[0].trim();
                  } else if (jsonText.includes('```')) {
                    jsonText = jsonText.split('```')[1].split('```')[0].trim();
                  }
                  try {
                    const parsed = JSON.parse(jsonText);
                    if (parsed.response) {
                      displayContent = parsed.response;
                    }
                  } catch {
                    // Not JSON, use as-is
                  }
                }
                return (
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
                      <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
                    </div>
                  </div>
                );
              })}
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
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Status Badge */}
              {isEditing && (
                <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 ${
                  formData.verified 
                    ? 'bg-emerald-500/20 border-emerald-500/50' 
                    : 'bg-amber-500/20 border-amber-500/50'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${formData.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className={`font-semibold ${formData.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {formData.verified ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {formData.verified ? '(verified)' : '(unverified)'}
                  </span>
                </div>
              )}

              {/* Basic Info */}
              <Section title="Basic Information">
                <Input label="Title" name="title" value={formData.title} onChange={handleChange} highlighted={highlightedFields.has('title')} />
                <Textarea label="Summary" name="summary" value={formData.summary} onChange={handleChange} rows={2} highlighted={highlightedFields.has('summary')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date" name="date" type="date" value={formData.date} onChange={handleChange} highlighted={highlightedFields.has('date')} />
                  <Input label="Time" name="time" type="time" value={formData.time} onChange={handleChange} highlighted={highlightedFields.has('time')} />
                </div>
              </Section>

              {/* Location */}
              <Section title="Location">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Country" name="country" value={formData.country} onChange={handleChange} highlighted={highlightedFields.has('country')} />
                  <Input label="City / Site" name="city_or_site" value={formData.city_or_site} onChange={handleChange} highlighted={highlightedFields.has('city_or_site')} />
                </div>
              </Section>

              {/* Equipment */}
              <Section title="Equipment">
                <div className="grid grid-cols-3 gap-4">
                  <Select label="Paramotor Type" name="paramotor_type" value={formData.paramotor_type} onChange={handleChange} options={PARAMOTOR_TYPES} highlighted={highlightedFields.has('paramotor_type')} />
                  <Input label="Paramotor Frame" name="paramotor_frame" value={formData.paramotor_frame} onChange={handleChange} highlighted={highlightedFields.has('paramotor_frame')} />
                  <Input label="Paramotor Engine" name="paramotor_engine" value={formData.paramotor_engine} onChange={handleChange} highlighted={highlightedFields.has('paramotor_engine')} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Wing Manufacturer" name="wing_manufacturer" value={formData.wing_manufacturer} onChange={handleChange} highlighted={highlightedFields.has('wing_manufacturer')} />
                  <Input label="Wing Model" name="wing_model" value={formData.wing_model} onChange={handleChange} highlighted={highlightedFields.has('wing_model')} />
                  <Input label="Wing Size" name="wing_size" value={formData.wing_size} onChange={handleChange} highlighted={highlightedFields.has('wing_size')} />
                </div>
              </Section>

              {/* Pilot & Flight */}
              <Section title="Pilot & Flight">
                <Input label="Pilot Name" name="pilot_name" value={formData.pilot_name} onChange={handleChange} highlighted={highlightedFields.has('pilot_name')} />
                <Input label="Pilot Details" name="pilot_details" value={formData.pilot_details} onChange={handleChange} highlighted={highlightedFields.has('pilot_details')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Flight Altitude (m)" name="flight_altitude" type="number" value={formData.flight_altitude} onChange={handleChange} highlighted={highlightedFields.has('flight_altitude')} />
                  <Select label="Flight Phase" name="flight_phase" value={formData.flight_phase} onChange={handleChange} options={FLIGHT_PHASES} highlighted={highlightedFields.has('flight_phase')} />
                </div>
              </Section>

              {/* Incident Details */}
              <Section title="Incident Details">
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Severity" name="severity" value={formData.severity} onChange={handleChange} options={SEVERITIES} highlighted={highlightedFields.has('severity')} />
                  <Select label="Reserve Use" name="reserve_use" value={formData.reserve_use} onChange={handleChange} options={RESERVE_USE} highlighted={highlightedFields.has('reserve_use')} />
                </div>
                <Checkbox label="Potentially fatal" name="potentially_fatal" checked={formData.potentially_fatal} onChange={handleChange} highlighted={highlightedFields.has('potentially_fatal')} />
                <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} rows={4} highlighted={highlightedFields.has('description')} />
                <Textarea label="Causes Description" name="causes_description" value={formData.causes_description} onChange={handleChange} rows={3} highlighted={highlightedFields.has('causes_description')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Surface Type" name="surface_type" value={formData.surface_type} onChange={handleChange} placeholder="water / forest / rocks..." highlighted={highlightedFields.has('surface_type')} />
                  <Select label="Cause Confidence" name="cause_confidence" value={formData.cause_confidence} onChange={handleChange} options={CAUSE_CONFIDENCE} highlighted={highlightedFields.has('cause_confidence')} />
                </div>
                <Select label="Pilot Actions" name="pilot_actions" value={formData.pilot_actions} onChange={handleChange} options={PILOT_ACTIONS} highlighted={highlightedFields.has('pilot_actions')} />
                <Textarea label="Injury Details" name="injury_details" value={formData.injury_details} onChange={handleChange} rows={2} highlighted={highlightedFields.has('injury_details')} />
              </Section>

              {/* Hardware */}
              <Section title="Hardware">
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox label="Hardware failure occurred" name="hardware_failure" checked={formData.hardware_failure} onChange={handleChange} highlighted={highlightedFields.has('hardware_failure')} />
                  <Checkbox label="Issue could be found on preflight" name="bad_hardware_preflight" checked={formData.bad_hardware_preflight} onChange={handleChange} highlighted={highlightedFields.has('bad_hardware_preflight')} />
                </div>
              </Section>

              {/* Collapse Sequence */}
              <Section title="Collapse Sequence" highlighted={highlightedFields.has('collapse_types')}>
                <div>
                  <label className={`block text-xs font-medium mb-2 ${highlightedFields.has('collapse_types') ? 'text-emerald-400' : 'text-slate-400'}`}>Add collapse type to sequence</label>
                  <select
                    onChange={(e) => {
                      addCollapseType(e.target.value);
                      e.target.value = '';
                    }}
                    className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all appearance-none cursor-pointer ${highlightedFields.has('collapse_types') ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-600/50'}`}
                  >
                    <option value="" className="bg-slate-900">Select to add...</option>
                    {COLLAPSE_TYPES.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.collapse_types && formData.collapse_types.length > 0 && (
                  <div className="space-y-2">
                    <label className={`block text-xs font-medium ${highlightedFields.has('collapse_types') ? 'text-emerald-400' : 'text-slate-400'}`}>Sequence (in order)</label>
                    <div className="flex flex-wrap gap-2">
                      {formData.collapse_types.map((type, idx) => {
                        const label = COLLAPSE_TYPES.find(t => t.value === type)?.label || type;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border rounded-lg ${highlightedFields.has('collapse_types') ? 'border-emerald-500' : 'border-slate-600/50'}`}
                          >
                            <span className="text-xs text-orange-400 font-medium">{idx + 1}.</span>
                            <span className="text-sm text-slate-200">{label}</span>
                            <button
                              type="button"
                              onClick={() => removeCollapseType(idx)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Section>

              {/* Contributing Factors */}
              <Section title="Contributing Factors">
                <div className="grid grid-cols-3 gap-4">
                  <Select label="Trimmer Position" name="factor_trimmer_position" value={formData.factor_trimmer_position} onChange={handleChange} options={TRIMMER_POSITIONS} highlighted={highlightedFields.has('factor_trimmer_position')} />
                  <Select label="Accelerator Position" name="factor_accelerator" value={formData.factor_accelerator} onChange={handleChange} options={ACCELERATOR_POSITIONS} highlighted={highlightedFields.has('factor_accelerator')} />
                  <Select label="Mid-air Collision" name="factor_mid_air_collision" value={formData.factor_mid_air_collision} onChange={handleChange} options={MID_AIR_COLLISION} highlighted={highlightedFields.has('factor_mid_air_collision')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Checkbox label="Low flight altitude" name="factor_low_altitude" checked={formData.factor_low_altitude} onChange={handleChange} highlighted={highlightedFields.has('factor_low_altitude')} />
                  <Checkbox label="Performed maneuvers" name="factor_maneuvers" checked={formData.factor_maneuvers} onChange={handleChange} highlighted={highlightedFields.has('factor_maneuvers')} />
                  <Checkbox label="Thermally active weather" name="factor_thermal_weather" checked={formData.factor_thermal_weather} onChange={handleChange} highlighted={highlightedFields.has('factor_thermal_weather')} />
                  <Checkbox label="Entered rotor turbulence" name="factor_rotor_turbulence" checked={formData.factor_rotor_turbulence} onChange={handleChange} highlighted={highlightedFields.has('factor_rotor_turbulence')} />
                  <Checkbox label="Reflex profile wing" name="factor_reflex_profile" checked={formData.factor_reflex_profile} onChange={handleChange} highlighted={highlightedFields.has('factor_reflex_profile')} />
                  <Checkbox label="Helmet missing" name="factor_helmet_missing" checked={formData.factor_helmet_missing} onChange={handleChange} highlighted={highlightedFields.has('factor_helmet_missing')} />
                  <Checkbox label="Tree collision/landing" name="factor_tree_collision" checked={formData.factor_tree_collision} onChange={handleChange} highlighted={highlightedFields.has('factor_tree_collision')} />
                  <Checkbox label="Water landing" name="factor_water_landing" checked={formData.factor_water_landing} onChange={handleChange} highlighted={highlightedFields.has('factor_water_landing')} />
                  <Checkbox label="Ground starting" name="factor_ground_starting" checked={formData.factor_ground_starting} onChange={handleChange} highlighted={highlightedFields.has('factor_ground_starting')} />
                  <Checkbox label="Powerline collision" name="factor_powerline_collision" checked={formData.factor_powerline_collision} onChange={handleChange} highlighted={highlightedFields.has('factor_powerline_collision')} />
                  <Checkbox label="Turbulent conditions" name="factor_turbulent_conditions" checked={formData.factor_turbulent_conditions} onChange={handleChange} highlighted={highlightedFields.has('factor_turbulent_conditions')} />
                  <Checkbox label="Spiral maneuver" name="factor_spiral_maneuver" checked={formData.factor_spiral_maneuver} onChange={handleChange} highlighted={highlightedFields.has('factor_spiral_maneuver')} />
                </div>
              </Section>

              {/* Weather */}
              <Section title="Weather Conditions">
                <Input label="Wind Speed" name="wind_speed" value={formData.wind_speed} onChange={handleChange} placeholder="e.g., 10-15 km/h, gusts to 25" highlighted={highlightedFields.has('wind_speed')} />
                <Textarea label="Meteorological Conditions" name="meteorological_conditions" value={formData.meteorological_conditions} onChange={handleChange} rows={2} highlighted={highlightedFields.has('meteorological_conditions')} />
                <Textarea label="Thermal Conditions" name="thermal_conditions" value={formData.thermal_conditions} onChange={handleChange} rows={2} highlighted={highlightedFields.has('thermal_conditions')} />
              </Section>

              {/* Links */}
              <Section title="Links & Media">
                <Textarea label="Source Links (one per line)" name="source_links" value={formData.source_links} onChange={handleChange} rows={3} highlighted={highlightedFields.has('source_links')} />
                <Textarea label="Media Links (one per line)" name="media_links" value={formData.media_links} onChange={handleChange} rows={3} highlighted={highlightedFields.has('media_links')} />
                <Textarea label="Raw Report / Analysis" name="report_raw" value={formData.report_raw} onChange={handleChange} rows={6} highlighted={highlightedFields.has('report_raw')} />
              </Section>

              {/* Duplicate Check Results */}
              {duplicateResult && (
                <div className={`p-4 border rounded-xl ${getVerdictInfo(duplicateResult.confidence).bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-lg font-semibold ${getVerdictInfo(duplicateResult.confidence).color}`}>
                      {getVerdictInfo(duplicateResult.confidence).text}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDuplicateResult(null)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {duplicateResult.incidents && duplicateResult.incidents.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400 mb-2">Similar incidents found:</p>
                      {duplicateResult.incidents.map((incident) => (
                        <Link
                          key={incident.uuid}
                          to={`/edit/${incident.uuid}`}
                          className="block p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-white font-medium">{incident.title || 'Untitled'}</span>
                            {incident.date && (
                              <span className="text-slate-500 text-sm">{incident.date}</span>
                            )}
                          </div>
                          {(incident.country || incident.city_or_site) && (
                            <p className="text-slate-500 text-sm mt-1">
                              {[incident.city_or_site, incident.country].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No similar incidents found.</p>
                  )}
                </div>
              )}

              {/* Save Status */}
              {saveError && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Failed to save:</span>
                    <span>{saveError}</span>
                  </div>
                </div>
              )}
              {saveSuccess && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Saved successfully</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4 pb-8">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-6 py-3 bg-red-600/80 hover:bg-red-600 border border-red-500/50 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCheckDuplicates}
                  disabled={duplicateLoading}
                  className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {duplicateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Check Duplicates
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-700/80 hover:bg-slate-700 border border-slate-600/50 rounded-xl font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, highlighted }) {
  return (
    <div className={`bg-slate-800/30 backdrop-blur-sm border rounded-2xl p-5 transition-all ${highlighted ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-700/50'}`}>
      <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <span className={`w-1 h-4 rounded-full ${highlighted ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-gradient-to-b from-orange-500 to-amber-500'}`} />
        {title}
      </h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function Input({ label, name, type = 'text', value, onChange, placeholder, highlighted }) {
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 transition-colors ${highlighted ? 'text-emerald-400' : 'text-slate-400'}`}>{label}</label>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all ${highlighted ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-600/50'}`}
      />
    </div>
  );
}

function Textarea({ label, name, value, onChange, rows = 3, placeholder, highlighted }) {
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 transition-colors ${highlighted ? 'text-emerald-400' : 'text-slate-400'}`}>{label}</label>
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all resize-none ${highlighted ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-600/50'}`}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options, highlighted }) {
  return (
    <div>
      <label className={`block text-xs font-medium mb-1 transition-colors ${highlighted ? 'text-emerald-400' : 'text-slate-400'}`}>{label}</label>
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all appearance-none cursor-pointer ${highlighted ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-600/50'}`}
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

function Checkbox({ label, name, checked, onChange, highlighted }) {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer group px-2 py-1 rounded-lg transition-all ${highlighted ? 'bg-emerald-500/20 ring-1 ring-emerald-500/50' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked || false}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className={`w-4 h-4 bg-slate-900/50 border rounded peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all ${highlighted ? 'border-emerald-500' : 'border-slate-600/50'}`} />
        <svg
          className="absolute top-0.5 left-0.5 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className={`text-xs group-hover:text-slate-300 transition-colors ${highlighted ? 'text-emerald-400' : 'text-slate-400'}`}>{label}</span>
    </label>
  );
}

function ToolUseMessage({ name, input }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] px-3 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-200">
        <div className="flex items-center gap-2 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="font-medium">Fetching:</span>
          <span className="text-blue-300 truncate max-w-[200px]">{input?.url || JSON.stringify(input)}</span>
        </div>
      </div>
    </div>
  );
}

function ToolResultMessage({ content }) {
  const [expanded, setExpanded] = useState(false);
  // Handle content that might be an array of content blocks (Anthropic format)
  let textContent = content;
  if (Array.isArray(content)) {
    textContent = content.map(block => block.text || JSON.stringify(block)).join('\n');
  } else if (typeof content === 'object' && content !== null) {
    textContent = content.text || JSON.stringify(content);
  }
  const isLong = textContent && textContent.length > 300;
  const displayContent = isLong && !expanded ? textContent.slice(0, 300) + '...' : textContent;
  
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
        <div className="flex items-center gap-2 text-xs mb-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Downloaded content</span>
        </div>
        <pre className="text-xs text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto">{displayContent}</pre>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-emerald-400 hover:text-emerald-300 mt-1"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  );
}

export default IncidentForm;
