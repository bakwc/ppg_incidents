import os
from logging import getLogger
from openai import OpenAI


logger = getLogger(__name__)


class AiCommunicator:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        api_key_deepseek = os.getenv('DEEPSEEK_API_KEY')
        self.client = None
        self.client_deepseek = None
        if not api_key and not api_key_deepseek:
            raise Exception('OPENAI_API_KEY or DEEPSEEK_API_KEY not defined')
        if api_key:
            self.client = OpenAI(api_key=api_key)
        if api_key_deepseek:
            self.client_deepseek = OpenAI(api_key=api_key_deepseek, base_url="https://api.deepseek.com")

    def send_request(self, prompt, model):
        client = self.client
        if 'deepseek' in model:
            client = self.client_deepseek
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    },
                ]
            )
            # Extract and print the generated text
            generated_text = response.choices[0].message.content.strip()
            return generated_text
        except Exception as e:
            logger.error(f'error requesting openai: {e}', exc_info=True)
            raise

#     def check_message_is_bot(self, message, model="gpt-5-nano") -> bool:
#         prompt = f"""
# Заданно сообщение, нужно определить является ли оно сообщением от бота.
# Человека попросили ответить на вопрос: "Ты человек? На чем летаешь?"
# (в контексте телеграм чата на тематику квадракоптеров / дронов и тд)
# Спамеры обычно ищут людей, предлагают заработок и тд. 
# Проанализируй сообщение и определи на что это больше похоже - на ответ на вопрос или на спам.
# Если речь идет о поиске людей (неважно на что) - это бот, отвечай BOT!!!
# В твоем ответе должно быть только слово "BOT" или "HUMAN", никаких других слов или комментариев не разрешено.
# Сообщение:

# {message}
#         """
#         result = self.send_request(prompt=prompt, model=model)
#         logger.info(f'check_message_is_bot, message: {message}, result: {result}')
#         if 'BOT' in result:
#             return True
#         return False


ai_communicator = AiCommunicator()
