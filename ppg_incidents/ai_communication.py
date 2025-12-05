import json
import os
import ssl
import urllib.error
import urllib.request
from logging import getLogger

import anthropic
import certifi
from openai import OpenAI

from ppg_incidents.cleaner import clean_html_text, extract_pdf_text

logger = getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-large"

CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def get_webpage_content(url: str) -> str:
    """Download and clean webpage HTML content or extract text from PDF."""
    if not url:
        return "Error: No URL provided"
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    request = urllib.request.Request(url, headers={"User-Agent": CHROME_USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30, context=ssl_context) as response:
            content_type = response.headers.get("Content-Type", "")
            content = response.read()

            if "application/pdf" in content_type or url.lower().endswith(".pdf"):
                logger.info(f"Extracting text from PDF: {url}")
                return extract_pdf_text(content)
            else:
                html = content.decode("utf-8")
                return clean_html_text(html)
    except urllib.error.HTTPError as e:
        return f"Error fetching URL: HTTP {e.code} {e.reason}"
    except urllib.error.URLError as e:
        return f"Error fetching URL: {e.reason}"

INCIDENT_CHAT_SYSTEM_PROMPT = """You are an assistant helping to document paramotor incidents. 
Analyze the user's messages and extract incident details into a structured format.

If the user provides URLs to incident reports or relevant pages, use the get_webpage_content tool to fetch and analyze the content.

The incident has the following fields:
- title: Short title for the incident (max 300 chars)
- summary: Brief summary of what happened (mandatory to fill)
- date: Date of incident (YYYY-MM-DD format)
- time: Time of incident (HH:MM:SS format)
- country: Country where incident occurred. Full country name. Eg. "United States" - allowed, "USA" - not allowed.
- city_or_site: City or flying site name
- paramotor_type: One of: "footlaunch", "trike"
- paramotor_frame: Paramotor frame/chassis model
- paramotor_engine: Engine model
- wing_manufacturer: Wing/glider manufacturer
- wing_model: Wing model name
- wing_size: Wing size
- pilot_name: Pilot name. Only fill if real pilot name is known.
- pilot_details: Pilot details (experience, certifications, etc.)
- flight_altitude: Altitude in meters (integer)
- flight_phase: One of: "takeoff", "landing", "flight"
- severity: One of: "fatal", "serious", "minor"
- potentially_fatal: Boolean - could have resulted in death under different circumstances. Estimate yourself.
- description: Detailed description of the incident
- causes_description: Description of causes
- pilot_actions: One of: "wrong_input_triggered" (wrong input triggered incident), "mostly_wrong" (mostly wrong inputs while reacting), "mixed" (some correct and some wrong), "mostly_correct" (mostly correct inputs while reacting)
- injury_details: Details of pilot injuries (only fill if pilot was injured)
- hardware_failure: Boolean - hardware failure occurred
- bad_hardware_preflight: Boolean - hardware issue could have been found on preflight but pilot missed it
- collapse_types: Array of collapse types in sequence. Values: "asymmetric_small" (<30%), "asymmetric_medium" (30-50%), "asymmetric_large" (>50%), "frontal", "full_stall", "spin", "line_twist", "cravatte"
- reserve_use: One of: "not_deployed", "no_time", "tangled", "partially_opened", "fully_opened". no_time means he deployed but it didnt have time to open!
- surface_type: Type of surface (water, forest, rocks, mountains, etc.)
- cause_confidence: One of: "maximum", "high", "low", "minimal". If the reason is 100% known but a lot of fields missing - confidence should be "maximum". If all fields exists but reason not clear - confidence should be "low".
- factor_low_altitude: Boolean - low flight altitude was a factor. Low altitude is <80 meters altitude.
- factor_maneuvers: Boolean - performed maneuvers
- factor_accelerator: One of: "released", "partially_engaged", "fully_engaged"
- factor_thermal_weather: Boolean - thermally active weather
- factor_rotor_turbulence: Boolean - entered rotor turbulence
- factor_trimmer_position: One of: "closed", "partially_open", "fully_open"
- factor_reflex_profile: Boolean - presence of reflex profile
- factor_helmet_missing: Boolean - helmet was not worn
- factor_tree_collision: Boolean - landed/collided with tree
- factor_water_landing: Boolean - landed/fell in water
- factor_ground_starting: Boolean - ground starting (engine started while paramotor NOT ATTACHED to pilot, for footlaunch only)
- factor_powerline_collision: Boolean - collision with powerlines
- factor_turbulent_conditions: Boolean - turbulent conditions (thermals, rotor, wind gusts, etc.)
- factor_spiral_maneuver: Boolean - spiral maneuver (spiral dive, SAT, etc.)
- factor_mid_air_collision: One of: "fly_nearby", "got_in_wake_turbulence", "almost_collided", "collided".
- source_links: Links to sources (one per line)
- media_links: Links to videos/photos/reports (one per line)
- report_raw: Raw reports / analysis copied from source. If no link provided - just copy the text from the user message.
- wind_speed: Wind speed and gusts description
- meteorological_conditions: Weather conditions
- thermal_conditions: Thermal activity description

Your response must be valid JSON with exactly two keys:
- "response": Your text response to the user (ask clarifying questions, confirm details, etc.)
- "incident_data": Object with ONLY the fields that are new or updated based on the latest user message. Do NOT include unchanged fields. Do NOT include Unknown / Uncertain fields. Omit fields completely if they were not mentioned or updated.

Example - first message "Wing collapse in Spain, serious injuries":
{"response": "I've recorded the basic details. Can you tell me more about the weather conditions?", "incident_data": {"title": "Wing collapse in Spain", "country": "Spain", "severity": "serious"}}

Example - follow-up message "It was near Madrid, pilot name was John":
{"response": "Got it, updated the location and pilot info.", "incident_data": {"city_or_site": "Madrid", "pilot_name": "John"}}
"""

TOOLS = [
    {
        "name": "get_webpage_content",
        "description": "Fetches and cleans webpage content from a URL. Use this when user provides a URL to an incident report or relevant page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to fetch content from"
                }
            },
            "required": ["url"]
        }
    }
]


class AiCommunicator:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        api_key_deepseek = os.getenv('DEEPSEEK_API_KEY')
        api_key_anthropic = os.getenv('ANTHROPIC_API_KEY')
        self.client = None
        self.client_deepseek = None
        self.client_anthropic = None
        if not api_key and not api_key_deepseek and not api_key_anthropic:
            raise Exception('OPENAI_API_KEY or DEEPSEEK_API_KEY or ANTHROPIC_API_KEY not defined')
        if api_key:
            self.client = OpenAI(api_key=api_key)
        if api_key_deepseek:
            self.client_deepseek = OpenAI(api_key=api_key_deepseek, base_url="https://api.deepseek.com")
        if api_key_anthropic:
            self.client_anthropic = anthropic.Anthropic(api_key=api_key_anthropic)

    def get_embedding(self, text: str) -> list[float]:
        """Generate embedding for text using OpenAI text-embedding-3-large."""
        response = self.client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text
        )
        return response.data[0].embedding

    def send_request(self, prompt, model):
        if 'claude' in model:
            response = self.client_anthropic.messages.create(
                model=model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text.strip()

        client = self.client
        if 'deepseek' in model:
            client = self.client_deepseek

        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}],
                },
            ],
        )
        return response.choices[0].message.content.strip()

    def _handle_tool_call(self, tool_name: str, tool_input: dict) -> str:
        if tool_name == "get_webpage_content":
            return get_webpage_content(tool_input["url"])
        raise ValueError(f"Unknown tool: {tool_name}")

    def _extract_json_from_response(self, result_text: str) -> tuple[str, bool]:
        """Extract JSON text from response, returns (json_text, has_json_markers)."""
        if "```json" in result_text:
            return result_text.split("```json", 1)[1].split("```", 1)[0].strip(), True
        if "```" in result_text:
            return result_text.split("```", 1)[1].split("```", 1)[0].strip(), True
        return result_text, False

    def incident_chat(self, messages, incident_data, model="gpt-4o-mini"):
        system_prompt = INCIDENT_CHAT_SYSTEM_PROMPT
        if incident_data:
            system_prompt += f"\n\nCurrent incident data: {json.dumps(incident_data)}"

        if 'claude' in model:
            chat_messages = [{"role": msg["role"], "content": msg["content"]} for msg in messages]
            logger.info(f"Claude request - model: {model}, messages: {chat_messages}")
            response = self.client_anthropic.messages.create(
                model=model,
                max_tokens=4096,
                system=system_prompt,
                messages=chat_messages,
                tools=TOOLS,
            )

            while response.stop_reason == "tool_use":
                tool_use_block = next(block for block in response.content if block.type == "tool_use")
                tool_result = self._handle_tool_call(tool_use_block.name, tool_use_block.input)
                chat_messages.append({"role": "assistant", "content": response.content})
                chat_messages.append({
                    "role": "user",
                    "content": [{"type": "tool_result", "tool_use_id": tool_use_block.id, "content": tool_result}]
                })
                response = self.client_anthropic.messages.create(
                    model=model,
                    max_tokens=4096,
                    system=system_prompt,
                    messages=chat_messages,
                    tools=TOOLS,
                )

            while True:
                logger.info(f"Claude response content: {response.content}")
                text_block = next((block for block in response.content if block.type == "text"), None)
                if text_block is None:
                    logger.error(f"No text block in Claude response: {response.content}")
                    return {"response": "Error: No response from AI", "incident_data": {}}
                result_text = text_block.text.strip()
                logger.info(f"Claude raw response: {result_text}")

                json_text, has_json = self._extract_json_from_response(result_text)

                try:
                    return json.loads(json_text)
                except json.JSONDecodeError as e:
                    if not has_json:
                        logger.error(f"No JSON found in response, returning text only", exc_info=True)
                        return {"response": result_text, "incident_data": {}}
                    logger.warning(f"JSONDecodeError with has_json=True, asking Claude to retry: {e}")
                    chat_messages.append({"role": "assistant", "content": result_text})
                    chat_messages.append({"role": "user", "content": f"Your JSON is invalid: {e}. Please provide valid JSON."})
                    response = self.client_anthropic.messages.create(
                        model=model,
                        max_tokens=4096,
                        system=system_prompt,
                        messages=chat_messages,
                        tools=TOOLS,
                    )

        client = self.client
        if 'deepseek' in model:
            client = self.client_deepseek

        openai_tools = [
            {
                "type": "function",
                "function": {
                    "name": "get_webpage_content",
                    "description": "Fetches and cleans webpage content from a URL. Use this when user provides a URL to an incident report or relevant page.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "url": {
                                "type": "string",
                                "description": "The URL to fetch content from"
                            }
                        },
                        "required": ["url"]
                    }
                }
            }
        ]

        chat_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            chat_messages.append({"role": msg["role"], "content": msg["content"]})

        response = client.chat.completions.create(
            model=model,
            messages=chat_messages,
            tools=openai_tools,
        )

        while response.choices[0].message.tool_calls:
            assistant_message = response.choices[0].message
            chat_messages.append(assistant_message)
            for tool_call in assistant_message.tool_calls:
                tool_result = self._handle_tool_call(tool_call.function.name, json.loads(tool_call.function.arguments))
                chat_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result
                })
            response = client.chat.completions.create(
                model=model,
                messages=chat_messages,
                tools=openai_tools,
            )

        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)
        return result


ai_communicator = AiCommunicator()
