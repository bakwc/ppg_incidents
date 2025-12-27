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

### 4. Views (`incidents/views.py`)

**For Factor (Boolean):**
- Add to `BOOLEAN_FILTER_FIELDS` list (line 88-121) - **CRITICAL FOR FILTERING TO WORK**

**For Factor (Choice):**
- Add to `CHOICE_FILTER_FIELDS` list (line 124-135)

### 5. Migration

- Run: `poetry run python manage.py makemigrations`
- Run: `poetry run python manage.py migrate`

### 6. Regenerate Search Indices

- Run: `poetry run python manage.py generate_fts_index` - Updates full-text search index

## Frontend Changes

### 1. Constants

**Form Options (`next-frontend/components/IncidentForm.tsx`):**
- Primary cause: `PRIMARY_CAUSES` array (line 94-109)
- Factor choice: add new const array (like `TRIMMER_POSITIONS`, `ACCELERATOR_POSITIONS`)

**Labels (`next-frontend/components/IncidentView.tsx`):**
- Primary cause: `PRIMARY_CAUSE_LABELS` (line 83-97)
- Factor choice: add new const object (like `TRIMMER_LABELS`, `ACCELERATOR_LABELS`)

**Hints (`next-frontend/constants/hints.js`):**
- Primary cause: `PRIMARY_CAUSE_HINTS` (line 1-15)
- Factor: `CONTRIBUTING_FACTOR_HINTS` (line 32-64)

### 2. Form State (`next-frontend/components/IncidentForm.tsx`)

- Add to initial `formData` state (line 120-192)
  - Boolean: `factor_name: false`
  - Choice: `factor_name: ''`

### 3. Dashboard Analytics (`next-frontend/components/dashboards/`)

**For Primary Cause:**
- Add to `getPieFilterPacks()` in `dashboardUtils.js` (line 38-98)
- Add to exclusion list in "Other" category (line 97)
- Add to `getTimeBasedPieFilterPacks()` for trends (line 544-689)
- Update `causeKeyMap` in `CausesAnalysisDashboard.jsx` (line 77-89)

**For Factor:**
- Add to relevant filter packs in `getBarFilterPacks()` (line 100-156)
- Add to subcategory filter packs if applicable:
  - `getWrongControlInputFilterPacks()` (line 158-223)
  - `getHardwareFailureFilterPacks()` (line 225-269)
- Update hint map in `CausesAnalysisDashboard.jsx` if used (line 113-124)

### 4. Incident List Filters (`next-frontend/components/IncidentList.tsx`)

**For Primary Cause:**
- Add to `SELECT_FILTERS` array in `primary_cause` section (line 109-124)

**For Factor (Choice):**
- Add to `SELECT_FILTERS` array (line 19-125)

**For Factor (Boolean):**
- Add to appropriate filter array based on category:
  - General factors: `BOOLEAN_FILTERS` (line 127-146)
  - Pilot-related: `PILOT_RELATED_FILTERS` (line 148-157)
  - Hardware: `HARDWARE_FAILURE_FILTERS` (line 159-166)

### 5. Form Rendering (`next-frontend/components/IncidentForm.tsx`)

Add input in appropriate section (line 850+):

**Boolean Factor:**
```tsx
<Checkbox 
  label="Display Name" 
  name="factor_name" 
  checked={formData.factor_name} 
  onChange={handleChange} 
  highlighted={highlightedFields.has('factor_name')} 
  hint={CONTRIBUTING_FACTOR_HINTS.factor_name} 
/>
```

**Choice Factor:**
```tsx
<Select 
  label="Display Name" 
  name="factor_name" 
  value={formData.factor_name} 
  onChange={handleChange} 
  options={FACTOR_NAME_OPTIONS} 
  highlighted={highlightedFields.has('factor_name')} 
/>
```

### 6. Incident View (`next-frontend/components/IncidentView.tsx`)

Add display logic in factors section (line 349+ for Contributing Factors, line 379+ for Pilot-Related Factors):

**Boolean:**
```tsx
{incident.factor_name && <Badge label="Display Name" hint={CONTRIBUTING_FACTOR_HINTS.factor_name} />}
```

**Choice:**
```tsx
{incident.factor_name && <Badge label={`Display Name: ${FACTOR_NAME_LABELS[incident.factor_name]}`} hint={CONTRIBUTING_FACTOR_HINTS.factor_name} />}
```

## Testing

1. Test form input and saving
2. Test AI extraction from text
3. Verify dashboard statistics update
4. Check incident view displays correctly
5. Test filtering by new cause/factor

