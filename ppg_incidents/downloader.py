import re
import ssl
import subprocess
import urllib.error
import urllib.request
from logging import getLogger

import certifi
import yt_dlp
from cachetools import TTLCache, cached
from readabilipy import simple_json_from_html_string
from youtube_transcript_api import YouTubeTranscriptApi

from ppg_incidents.cleaner import extract_pdf_text

logger = getLogger(__name__)

CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

YOUTUBE_URL_PATTERN = re.compile(
    r'(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})'
)

webpage_cache = TTLCache(maxsize=100, ttl=600)


def get_youtube_metadata(video_id: str) -> dict:
    """Fetch metadata from a YouTube video using yt_dlp."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
        return {
            'title': info.get('title'),
            'description': info.get('description'),
            'uploader': info.get('uploader'),
            'upload_date': info.get('upload_date'),
            'duration': info.get('duration'),
            'view_count': info.get('view_count'),
            'like_count': info.get('like_count'),
        }


def get_youtube_transcript(video_id: str) -> str | None:
    """Fetch transcript from a YouTube video."""
    ytt_api = YouTubeTranscriptApi()
    transcript_list = ytt_api.list(video_id)
    for transcript in transcript_list:
        res = transcript.fetch()
        return ' '.join([e.text for e in res])
    return None


@cached(webpage_cache)
def get_webpage_content(url: str) -> str:
    """Download and clean webpage HTML content or extract text from PDF."""
    if not url:
        return "Error: No URL provided"
    
    youtube_match = YOUTUBE_URL_PATTERN.search(url)
    if youtube_match:
        video_id = youtube_match.group(1)
        logger.info(f"Fetching YouTube content for video: {video_id}")
        result_parts = []
        
        try:
            metadata = get_youtube_metadata(video_id)
            result_parts.append(f"Title: {metadata['title']}")
            result_parts.append(f"Uploader: {metadata['uploader']}")
            result_parts.append(f"Upload Date: {metadata['upload_date']}")
            result_parts.append(f"Duration: {metadata['duration']} seconds")
            result_parts.append(f"Views: {metadata['view_count']}")
            result_parts.append(f"Likes: {metadata['like_count']}")
            result_parts.append(f"Description: {metadata['description']}")
        except Exception as e:
            result_parts.append(f"Error fetching YouTube metadata: {e}")
        
        try:
            transcript = get_youtube_transcript(video_id)
            if transcript:
                result_parts.append(f"\nTranscript:\n{transcript}")
            else:
                result_parts.append("\nNo transcript available for this video")
        except Exception as e:
            result_parts.append(f"\nError fetching YouTube transcript: {e}")
        
        return '\n'.join(result_parts)
    
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
                try:
                    article = simple_json_from_html_string(html, use_readability=True)
                except subprocess.CalledProcessError:
                    article = simple_json_from_html_string(html, use_readability=False)
                plain_text = article["plain_text"]
                if plain_text:
                    if isinstance(plain_text, list):
                        return plain_text[0]["text"]
                    return plain_text
                return f"Could not extract readable content from {url}"
    except urllib.error.HTTPError as e:
        return f"Error fetching URL: HTTP {e.code} {e.reason}"
    except urllib.error.URLError as e:
        return f"Error fetching URL: {e.reason}"

