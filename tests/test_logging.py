import json
import os
from pathlib import Path
from django.test import TestCase, Client
from django.contrib.auth.models import User


class APILoggingTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.logs_dir = Path(__file__).resolve().parent.parent / 'logs'
        self.logs_file = self._get_current_log_file()

    def _get_current_log_file(self):
        pid = os.getpid()
        return self.logs_dir / f'api_calls.{pid}.jsonl'

    def test_api_call_is_logged(self):
        initial_size = self.logs_file.stat().st_size if self.logs_file.exists() else 0

        response = self.client.get('/api/incidents/')

        self.logs_file.exists()

        current_size = self.logs_file.stat().st_size
        current_size > initial_size

        with open(self.logs_file, 'r') as f:
            f.seek(initial_size)
            new_logs = f.read()

        lines = [line for line in new_logs.strip().split('\n') if line]
        len(lines) > 0

        last_log = json.loads(lines[-1])

        last_log['event'] == 'api_call'
        last_log['method'] == 'GET'
        '/api/incidents/' in last_log['path']
        last_log['status_code'] == 200

    def test_authenticated_user_logged(self):
        self.client.login(username='testuser', password='testpass123')

        initial_size = self.logs_file.stat().st_size if self.logs_file.exists() else 0

        response = self.client.get('/api/incidents/')

        with open(self.logs_file, 'r') as f:
            f.seek(initial_size)
            new_logs = f.read()

        lines = [line for line in new_logs.strip().split('\n') if line]
        last_log = json.loads(lines[-1])

        last_log['user_id'] == self.user.id
        last_log['username'] == 'testuser'

    def test_post_request_body_logged(self):
        initial_size = self.logs_file.stat().st_size if self.logs_file.exists() else 0

        test_data = {'test': 'data', 'number': 123}
        response = self.client.post(
            '/api/token/',
            data=json.dumps(test_data),
            content_type='application/json'
        )

        with open(self.logs_file, 'r') as f:
            f.seek(initial_size)
            new_logs = f.read()

        lines = [line for line in new_logs.strip().split('\n') if line]
        last_log = json.loads(lines[-1])

        last_log['method'] == 'POST'
        'request_body' in last_log

