# Adding New Primary Causes or Factors

## Backend Changes

### 1. Models (`incidents/models.py`)

**For Primary Cause:**
- Add to `PrimaryCause` TextChoices class (line 76-87)
- Update `to_text()` method if needed (line 277-278)

**For Factor:**
- Add field to `Incident` model (line 157-189)
  - Boolean: `factor_name = models.BooleanField(null=True, blank=True, verbose_name="Display Name")`
  - Choice: `factor_name = models.CharField(max_length=30, choices=ChoiceClass.choices, null=True, blank=True, verbose_name="Display Name")`
- Add to `to_text()` method in factors section (line 306-373)

### 2. AI Prompt (`ppg_incidents/ai_communication.py`)

- Add to `INCIDENT_CHAT_SYSTEM_PROMPT` (line 14-98)
  - Primary cause: line 40
  - Factor: line 49-80

### 3. Serializer (`incidents/serializers.py`)

- For choice fields: add to `choice_fields` dict in `to_internal_value()` (line 23-33)

### 4. Migration

- Run: `poetry run python manage.py makemigrations`
- Run: `poetry run python manage.py migrate`

## Frontend Changes

### 1. Constants

**Form Options (`frontend/src/components/IncidentForm.jsx`):**
- Primary cause: `PRIMARY_CAUSES` array (line 90-103)
- Factor choice: add new const array (like `TRIMMER_POSITIONS`, `ACCELERATOR_POSITIONS`)

**Labels (`frontend/src/components/IncidentView.jsx`):**
- Primary cause: `PRIMARY_CAUSE_LABELS` (line 80-92)
- Factor choice: add new const object (like `TRIMMER_LABELS`, `ACCELERATOR_LABELS`)

**Hints (`frontend/src/constants/hints.js`):**
- Primary cause: `PRIMARY_CAUSE_HINTS` (line 1-13)
- Factor: `CONTRIBUTING_FACTOR_HINTS` (line 30-60)

### 2. Form State (`frontend/src/components/IncidentForm.jsx`)

- Add to initial `formData` state (line 114-184)
  - Boolean: `factor_name: false`
  - Choice: `factor_name: ''`

### 3. Dashboard Analytics (`frontend/src/components/dashboards/dashboardUtils.js`)

**For Primary Cause:**
- Add to `getPieFilterPacks()` (line 38-98)
- Add to exclusion list in "Other" category (line 97)
- Add to `getTimeBasedPieFilterPacks()` for trends (line 544-689)
- Update `causeKeyMap` in `CausesAnalysisDashboard.jsx` (line 77-89)

**For Factor:**
- Add to relevant filter packs in `getBarFilterPacks()` (line 100-156)
- Add to subcategory filter packs if applicable:
  - `getWrongControlInputFilterPacks()` (line 158-223)
  - `getHardwareFailureFilterPacks()` (line 225-269)
- Update hint map in `CausesAnalysisDashboard.jsx` if used (line 113-124)

### 4. Incident List Filters (`frontend/src/components/IncidentList.jsx`)

**For Primary Cause:**
- Add to `SELECT_FILTERS` array in `primary_cause` section (line 109-124)

**For Factor (Choice):**
- Add to `SELECT_FILTERS` array (line 19-125)

**For Factor (Boolean):**
- Add to appropriate filter array based on category:
  - General factors: `BOOLEAN_FILTERS` (line 127-146)
  - Pilot-related: `PILOT_RELATED_FILTERS` (line 148-157)
  - Hardware: `HARDWARE_FAILURE_FILTERS` (line 159-166)

### 5. Form Rendering (`frontend/src/components/IncidentForm.jsx`)

Add input in appropriate section (line 600+):

**Boolean Factor:**
```jsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    name="factor_name"
    checked={formData.factor_name}
    onChange={handleChange}
    className="checkbox-custom"
  />
  <span>Display Name</span>
  <HintPopup hint={CONTRIBUTING_FACTOR_HINTS.factor_name} />
</label>
```

**Choice Factor:**
```jsx
<div>
  <label className="label-custom">
    Display Name
    <HintPopup hint={CONTRIBUTING_FACTOR_HINTS.factor_name} />
  </label>
  <select
    name="factor_name"
    value={formData.factor_name}
    onChange={handleChange}
    className="input-custom"
  >
    {FACTOR_NAME_OPTIONS.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
</div>
```

### 6. Incident View (`frontend/src/components/IncidentView.jsx`)

Add display logic in factors section (line 290+):

**Boolean:**
```jsx
{incident.factor_name && (
  <span className="inline-flex items-center gap-1.5">
    Display Name
    <HintPopup hint={CONTRIBUTING_FACTOR_HINTS.factor_name} />
  </span>
)}
```

**Choice:**
```jsx
{incident.factor_name && (
  <span className="inline-flex items-center gap-1.5">
    Display Name: {FACTOR_NAME_LABELS[incident.factor_name]}
    <HintPopup hint={CONTRIBUTING_FACTOR_HINTS.factor_name} />
  </span>
)}
```

## Testing

1. Test form input and saving
2. Test AI extraction from text
3. Verify dashboard statistics update
4. Check incident view displays correctly
5. Test filtering by new cause/factor

