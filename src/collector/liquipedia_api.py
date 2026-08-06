import time
import logging
import requests
from typing import Dict, List, Any, Optional
from src.config import LIQUIPEDIA_API_URL, DEFAULT_USER_AGENT, API_REQUEST_DELAY
from src.collector.rate_limiter import RateLimiter
logger = logging.getLogger(__name__)

class LiquipediaAPIClient:

    def __init__(self, user_agent: Optional[str]=None, delay: float=API_REQUEST_DELAY):
        self.user_agent = user_agent or DEFAULT_USER_AGENT
        self.rate_limiter = RateLimiter(min_interval=delay)
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': self.user_agent, 'Accept-Encoding': 'gzip', 'Accept': 'application/json'})

    def _make_request(self, params: Dict[str, Any], max_retries: int=5) -> Dict[str, Any]:
        params['format'] = 'json'
        for attempt in range(1, max_retries + 1):
            self.rate_limiter.wait()
            try:
                response = self.session.get(LIQUIPEDIA_API_URL, params=params, timeout=30)
                if response.status_code == 429:
                    backoff = attempt * 30
                    logger.warning(f'Rate limited (429). Waiting {backoff}s before retry {attempt}/{max_retries}...')
                    time.sleep(backoff)
                    continue
                response.raise_for_status()
                data = response.json()
                if 'error' in data:
                    logger.error(f"Liquipedia API Error: {data['error']}")
                    raise ValueError(f"API Error: {data['error']}")
                return data
            except requests.RequestException as e:
                logger.error(f'HTTP request failed on attempt {attempt}/{max_retries}: {e}')
                if attempt == max_retries:
                    raise
                time.sleep(attempt * 5)
        return {}

    def fetch_category_members(self, category_name: str, limit: int=500) -> List[Dict[str, Any]]:
        cat_title = category_name if category_name.startswith('Category:') else f'Category:{category_name}'
        all_members = []
        cm_continue = None
        while True:
            params = {'action': 'query', 'list': 'categorymembers', 'cmtitle': cat_title, 'cmlimit': str(min(limit - len(all_members), 500)), 'cmtype': 'page'}
            if cm_continue:
                params['cmcontinue'] = cm_continue
            data = self._make_request(params)
            members = data.get('query', {}).get('categorymembers', [])
            all_members.extend(members)
            cont = data.get('continue', {})
            cm_continue = cont.get('cmcontinue')
            if not cm_continue or len(all_members) >= limit:
                break
        return all_members

    def fetch_page_wikitext(self, page_title: str) -> Optional[str]:
        params = {'action': 'query', 'titles': page_title, 'prop': 'revisions', 'rvprop': 'content', 'rvslots': 'main', 'rvlimit': '1'}
        data = self._make_request(params)
        pages = data.get('query', {}).get('pages', {})
        for page_id, page_data in pages.items():
            if page_id == '-1':
                return None
            revisions = page_data.get('revisions', [])
            if revisions:
                slots = revisions[0].get('slots', {})
                main_slot = slots.get('main', {})
                return main_slot.get('*') or main_slot.get('content')
        return None
