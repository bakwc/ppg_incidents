# PPG Incidents

Database of paramotor incidents with AI-assisted data entry.

## Setup

```bash
poetry install
poetry run python manage.py migrate
```

## Run

```bash
poetry run python manage.py runserver
```

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key
- `DEEPSEEK_API_KEY` - DeepSeek API key (optional, alternative to OpenAI)

## Run Tests

```bash
poetry run pytest
```

## API Endpoints

### GET /incidents

List all incidents.

Query params:
- `order_by` - field name to order by (e.g. `-date`, `country`)

### GET /incident/{uuid}

Get single incident by UUID.

### PATCH /incident/{uuid}/update

Update incident fields.

Request body: JSON with fields to update.

### POST /incident/chat

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

### POST /incident/save

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

