import json
import os
from logging import getLogger

import anthropic
from openai import OpenAI

logger = getLogger(__name__)

INCIDENT_CHAT_SYSTEM_PROMPT = """You are an assistant helping to document paramotor incidents. 
Analyze the user's messages and extract incident details into a structured format.

The incident has the following fields:
- title: Short title for the incident (max 300 chars)
- summary: Brief summary of what happened
- date: Date of incident (YYYY-MM-DD format)
- time: Time of incident (HH:MM:SS format)
- country: Country where incident occurred
- city_or_site: City or flying site name
- paramotor_frame: Paramotor frame/chassis model
- paramotor_engine: Engine model
- wing_manufacturer: Wing/glider manufacturer
- wing_model: Wing model name
- wing_size: Wing size
- pilot: Pilot name or identifier
- flight_altitude: Altitude in meters (integer)
- flight_phase: One of: "takeoff", "landing", "flight"
- severity: One of: "fatal", "serious", "minor"
- potentially_fatal: Boolean - could have resulted in death under different circumstances
- description: Detailed description of the incident
- causes_description: Description of causes
- reserve_use: One of: "not_deployed", "no_time", "tangled", "partially_opened", "fully_opened"
- surface_type: Type of surface (water, forest, rocks, mountains, etc.)
- cause_confidence: One of: "maximum", "high", "low", "minimal"
- factor_low_altitude: Boolean - low flight altitude was a factor
- factor_maneuvers: Boolean - performed maneuvers
- factor_accelerator: Boolean - accelerator position was a factor
- factor_thermal_weather: Boolean - thermally active weather
- factor_rotor_turbulence: Boolean - entered rotor turbulence
- factor_trimmer_position: Boolean - trimmer position was a factor
- factor_reflex_profile: Boolean - presence of reflex profile
- factor_helmet_worn: Boolean - was helmet worn
- factor_tree_collision: Boolean - landed/collided with tree
- factor_water_landing: Boolean - landed/fell in water
- source_links: Links to sources (one per line)
- media_links: Links to videos/photos/reports (one per line)
- wind_speed: Wind speed and gusts description
- meteorological_conditions: Weather conditions
- thermal_conditions: Thermal activity description

Your response must be valid JSON with exactly two keys:
- "response": Your text response to the user (ask clarifying questions, confirm details, etc.)
- "incident_data": Object with incident fields. Only include fields that have been mentioned or can be inferred. Use null for unknown fields.

Example response:
{"response": "I've recorded the basic details. Can you tell me more about the weather conditions?", "incident_data": {"title": "Wing collapse near Madrid", "country": "Spain", "severity": "serious"}}
"""


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
            )
            result_text = response.content[0].text.strip()
            logger.info(f"Claude raw response: {result_text}")
            if result_text.startswith("```"):
                result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            result = json.loads(result_text)
            return result

        client = self.client
        if 'deepseek' in model:
            client = self.client_deepseek

        chat_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            chat_messages.append({"role": msg["role"], "content": msg["content"]})

        response = client.chat.completions.create(
            model=model,
            messages=chat_messages,
            response_format={"type": "json_object"},
        )

        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)
        return result


ai_communicator = AiCommunicator()
