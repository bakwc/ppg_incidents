import time
import json
import structlog
from django.utils.deprecation import MiddlewareMixin


logger = structlog.get_logger(__name__)


class APILoggingMiddleware(MiddlewareMixin):
    """Logs all API requests and responses in structured JSON format."""

    def process_request(self, request):
        request._start_time = time.time()
        
        request._cached_body = None
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                request._cached_body = request.body
            except Exception:
                pass
        
        return None

    def process_response(self, request, response):
        if not hasattr(request, '_start_time'):
            return response

        duration = time.time() - request._start_time

        user_id = None
        username = None
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = request.user.id
            username = request.user.username

        response_body = None
        if hasattr(response, 'content') and len(response.content) < 10000:
            try:
                response_body = json.loads(response.content.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
                response_body = response.content.decode('utf-8', errors='ignore')[:500]

        request_body = None
        if hasattr(request, '_cached_body') and request._cached_body:
            try:
                request_body = json.loads(request._cached_body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError, AttributeError, ValueError):
                request_body = None

        logger.info(
            "api_call",
            event_type="api_call",
            method=request.method,
            path=request.path,
            query_params=dict(request.GET),
            status_code=response.status_code,
            user_id=user_id,
            username=username,
            duration_seconds=round(duration, 4),
            request_body=request_body,
            response_body=response_body,
            remote_addr=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:200],
        )

        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

