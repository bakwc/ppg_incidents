# PPG Incidents

Database of paramotor incidents with AI-assisted data entry.

## Setup

```bash
poetry install
poetry run python manage.py migrate
```

## Run

Backend:
```bash
./run.py runserver
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `DEEPSEEK_API_KEY` - DeepSeek API key (optional)
- `ANTHROPIC_API_KEY` - Anthropic API key (optional)

At least one API key must be set.

## Run Tests

```bash
./run.py test
```

## Development Guides

- [Adding New Primary Causes or Factors](ADDING_CAUSES_FACTORS.md)

## Management Commands

### create_from_url

Create incident from URL using LLM. Supports single URLs or bulk import from USPPA incidents list.

```bash
python manage.py create_from_url <url> [--model MODEL] [--force]
```

### fill_report_raw

Fetch content from source_links and populate report_raw field for incidents missing it.

```bash
python manage.py fill_report_raw
```

### generate_embeddings

Generate vector embeddings for semantic search. Skips incidents with existing embeddings unless --force.

```bash
python manage.py generate_embeddings [--force]
```

### generate_fts_index

Build/rebuild FTS5 full-text search index for all incidents.

```bash
python manage.py generate_fts_index
```

### show_incident_text

Display to_text() output for an incident (useful for debugging search indexing).

```bash
python manage.py show_incident_text <uuid>
```

## API Endpoints

### GET /api/incidents

List all incidents.

Query params:
- `order_by` - field name to order by (e.g. `-date`, `country`)

### GET /api/incident/{uuid}

Get single incident by UUID.

### PATCH /api/incident/{uuid}/update

Update incident fields.

Request body: JSON with fields to update.

### POST /api/incident/chat

AI-assisted incident creation. Send conversation messages, receive AI response with extracted incident data.

Request body:
```json
{
  "messages": [{"role": "user", "content": "..."}],
  "incident_data": null
}
```

Response:
```json
{
  "response": "AI text response",
  "incident_data": {"title": "...", "country": "..."},
  "saved": false
}
```

### POST /api/incident/save

Save incident data to database.

Request body:
```json
{
  "incident_data": {"title": "...", "country": "..."}
}
```

Response:
```json
{
  "incident": {...},
  "saved": true
}
```

