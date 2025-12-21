import json
import os
from logging import getLogger

import anthropic
from openai import OpenAI

from ppg_incidents.downloader import get_webpage_content

logger = getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-large"

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
- flight_phase: One of: "ground" (pilot was not flying), "takeoff", "landing", "flight"
- severity: One of: "fatal", "serious", "minor"
- potentially_fatal: Boolean - could have resulted in death under different circumstances. Estimate yourself.
- description: Detailed description of the incident
- causes_description: Description of causes
- primary_cause: One of: "turbulence", "wrong_control_input", "hardware_failure", "powerline_collision", "midair_collision", "lines_brakes_issues", "water_landing", "preflight_error", "ground_starting", "ground_object_collision", "rain_fog_snow". Do not fill if not sure, leave empty.
- pilot_actions: One of: "wrong_input_triggered" (wrong input triggered incident), "mostly_wrong" (mostly wrong inputs while reacting), "mixed" (some correct and some wrong), "mostly_correct" (mostly correct inputs while reacting). Focus on piloting actions, not the general decision making. If pilot himself triggered incident eg by agressive maneuvers - use "wrong_input_triggered".
- injury_details: Details of pilot injuries (only fill if pilot was injured)
- hardware_failure: Boolean - hardware failure occurred
- bad_hardware_preflight: Boolean - hardware issue could have been found on preflight but pilot missed it
- collapse_types: Array of collapse types in sequence. Values: "asymmetric_small" (<30%), "asymmetric_medium" (30-50%), "asymmetric_large" (>50%), "frontal", "full_stall", "spin", "line_twist", "cravatte", "unknown". Unknown means the collapse HAPPENED but type is not known.
- reserve_use: DO NOT USE no_time IF NO ATTEMPT TO DEPLOY WAS MADE!!! One of: "not_installed", "not_deployed", "no_time" (DO NOT USE IT IF NO ATTEMPT TO DEPLOY WAS MADE!!!), "tangled", "partially_opened", "fully_opened". not_installed means pilot had no reserve parachute at all. no_time means he deployed but it didnt have time to open! DO NOT USE "no_time" if there was NO DEPLOY ATTEMPT!!!
- surface_type: Type of surface (water, forest, rocks, mountains, etc.)
- cause_confidence: One of: "maximum", "high", "low", "minimal". If the reason is 100% known but a lot of fields missing - confidence should be "maximum". If all fields exists but reason not clear - confidence should be "low".
- factor_low_altitude: Boolean - low flight altitude was a factor. Low altitude is <80 meters altitude.
- factor_maneuvers: Boolean - performed maneuvers contributing to the incident, like aggressive maneuvers or turn in wrong place etc. Regular slow turn etc is not a maneuver.
- factor_accelerator: One of: "not_used", "released", "partially_engaged", "fully_engaged"
- factor_thermal_weather: Boolean - thermally active weather
- factor_rain: Boolean - rain during flight
- factor_rotor_turbulence: Boolean - entered rotor turbulence
- factor_wake_turbulence: Boolean - entered wake turbulence from another aircraft or himself
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
- factor_ground_object_collision: Boolean - collision with ground object
- factor_released_brake_toggle: Boolean - pilot released or lost the brake toggle
- factor_wrongly_adjusted_trims: Boolean - trims were wrongly adjusted
- factor_accidental_motor_kill: Boolean - accidental motor kill
- factor_wrong_throttle_management: Boolean - wrong throttle management
- factor_accidental_reserve_deployment: Boolean - accidental reserve deployment
- factor_oscillations_out_of_control: Boolean - oscillations out of control
- factor_student_pilot: Boolean - student pilot
- factor_medical_issues: Boolean - pilot had medical issues
- factor_engine_failure: Boolean - engine failure
- factor_trimmers_failure: Boolean - trimmers failure
- factor_structural_failure: Boolean - structural failure (frame / carabiners / etc.)
- factor_fire: Boolean - fire
- factor_throttle_system_issues: Boolean - throttle system issues (cable / button / etc.)
- factor_paraglider_failure: Boolean - paraglider (wing) failure (material / porosity issues / torn / etc.)
- source_links: Links to sources (one per line)
- media_links: Links to videos/photos/reports (one per line)
- report_raw: Raw reports / analysis copied from source. If no link provided - just copy the text from the user message.
- wind_speed: Wind speed and gusts description
- wind_speed_ms: Wind speed in m/s (float)
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
        "description": "Fetches and cleans webpage content from a URL. Use this when user provides a URL to an incident report or relevant page or youtube video.",
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
        # text-embedding-3-large has 8192 token limit, truncate to ~7000 tokens (~28000 chars)
        max_chars = 28000
        if len(text) > max_chars:
            text = text[:max_chars]
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

    def _serialize_anthropic_messages(self, messages: list) -> list:
        """Convert Anthropic message objects to JSON-serializable dicts."""
        serialized = []
        for msg in messages:
            if isinstance(msg.get("content"), list):
                content = []
                for block in msg["content"]:
                    if hasattr(block, "type"):
                        if block.type == "tool_use":
                            content.append({
                                "type": "tool_use",
                                "id": block.id,
                                "name": block.name,
                                "input": block.input,
                            })
                        elif block.type == "tool_result":
                            content.append({
                                "type": "tool_result",
                                "tool_use_id": block["tool_use_id"],
                                "content": block["content"],
                            })
                        elif block.type == "text":
                            content.append({
                                "type": "text",
                                "text": block.text,
                            })
                        else:
                            content.append({"type": block.type})
                    elif isinstance(block, dict):
                        content.append(block)
                    else:
                        content.append(str(block))
                serialized.append({"role": msg["role"], "content": content})
            else:
                serialized.append({"role": msg["role"], "content": msg["content"]})
        return serialized

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
                tool_use_blocks = [block for block in response.content if block.type == "tool_use"]
                tool_results = []
                for tool_use_block in tool_use_blocks:
                    tool_result = self._handle_tool_call(tool_use_block.name, tool_use_block.input)
                    text_content = str(tool_result) if tool_result else "No content retrieved"
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool_use_block.id,
                        "content": [{"type": "text", "text": text_content}]
                    })
                chat_messages.append({"role": "assistant", "content": response.content})
                chat_messages.append({"role": "user", "content": tool_results})
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
                    return {"response": "Error: No response from AI", "incident_data": {}, "messages": self._serialize_anthropic_messages(chat_messages)}
                result_text = text_block.text.strip()
                logger.info(f"Claude raw response: {result_text}")

                json_text, has_json = self._extract_json_from_response(result_text)

                try:
                    parsed = json.loads(json_text)
                    chat_messages.append({"role": "assistant", "content": result_text})
                    return {
                        "response": parsed.get("response", ""),
                        "incident_data": parsed.get("incident_data", {}),
                        "messages": self._serialize_anthropic_messages(chat_messages),
                    }
                except json.JSONDecodeError as e:
                    if not has_json:
                        logger.error(f"No JSON found in response, returning text only", exc_info=True)
                        chat_messages.append({"role": "assistant", "content": result_text})
                        return {"response": result_text, "incident_data": {}, "messages": self._serialize_anthropic_messages(chat_messages)}
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
            chat_messages.append({
                "role": "assistant",
                "content": assistant_message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments}
                    }
                    for tc in assistant_message.tool_calls
                ]
            })
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
        chat_messages.append({"role": "assistant", "content": result_text})
        # Filter out system message from returned messages
        return_messages = [m for m in chat_messages if m.get("role") != "system"]
        return {
            "response": result.get("response", ""),
            "incident_data": result.get("incident_data", {}),
            "messages": return_messages,
        }


ai_communicator = AiCommunicator()
