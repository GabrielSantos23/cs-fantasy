import re
import hashlib
from typing import Dict, List, Any, Optional

def build_liquipedia_image_url(image_name: str) -> Optional[str]:
    if not image_name:
        return None
    clean_name = image_name.strip().replace(' ', '_')
    if not clean_name:
        return None
    md5_hash = hashlib.md5(clean_name.encode('utf-8')).hexdigest()
    return f'https://liquipedia.net/commons/images/{md5_hash[0]}/{md5_hash[0:2]}/{clean_name}'

def safe_split_params(block: str) -> List[str]:
    tokens = []
    current = []
    bracket_depth = 0
    brace_depth = 0
    for char in block:
        if char == '[':
            bracket_depth += 1
            current.append(char)
        elif char == ']':
            bracket_depth = max(0, bracket_depth - 1)
            current.append(char)
        elif char == '{':
            brace_depth += 1
            current.append(char)
        elif char == '}':
            brace_depth = max(0, brace_depth - 1)
            current.append(char)
        elif char == '|' and bracket_depth == 0 and (brace_depth == 0):
            tokens.append(''.join(current).strip())
            current = []
        else:
            current.append(char)
    if current:
        tokens.append(''.join(current).strip())
    return [t for t in tokens if t]

def get_team_placement(team_name: str, prize_map: Dict[str, str]) -> str:
    if not prize_map:
        return '5-8'
    t_clean = team_name.lower()
    if t_clean in prize_map:
        return prize_map[t_clean]
    initials = ''.join((w[0] for w in t_clean.split() if w[0].isalnum()))
    words = [w for w in t_clean.split() if w.isalnum()]
    for key, place in prize_map.items():
        key_clean = key.lower()
        if key_clean == t_clean:
            return place
        if key_clean == initials:
            return place
        if any((w == key_clean for w in words)):
            return place
        if key_clean == 'navi' and 'natus' in t_clean:
            return place
        if key_clean == 'lg' and 'luminosity' in t_clean:
            return place
        if key_clean in t_clean or t_clean in key_clean:
            return place
    return '5-8'

class WikitextParser:

    @staticmethod
    def _split_template_params(block: str) -> Dict[str, str]:
        params = {}
        flat_tokens = safe_split_params(block.replace('\n', '|'))
        for token in flat_tokens:
            token = token.strip()
            if '=' not in token:
                continue
            k, v = token.split('=', 1)
            k = k.strip().lower()
            v = v.strip()
            if k and v:
                params[k] = v
        return params

    @staticmethod
    def parse_infobox_league(wikitext: str, fallback_title: str) -> Dict[str, Any]:
        info = {'name': fallback_title, 'start_date': None, 'end_date': None, 'tier': 'A-Tier', 'format': None}
        match = re.search('\\{\\{Infobox league(.*?)\\n\\}\\}', wikitext, re.DOTALL | re.IGNORECASE)
        if match:
            params = WikitextParser._split_template_params(match.group(1))
            if params.get('name'):
                v = re.sub('\\[\\[(?:[^|]*\\|)?([^\\]]+)\\]\\]', '\\1', params['name']).strip()
                if v:
                    info['name'] = v
            for k_date in ('sdate', 'startdate'):
                if params.get(k_date):
                    info['start_date'] = params[k_date]
                    break
            for k_date in ('edate', 'enddate'):
                if params.get(k_date):
                    info['end_date'] = params[k_date]
                    break
            for k_tier in ('liquipediatier', 'publishertier', 'tier'):
                if params.get(k_tier):
                    info['tier'] = params[k_tier]
                    break
            if params.get('format'):
                info['format'] = params['format']
        return info

    @staticmethod
    def parse_team_cards(wikitext: str) -> List[Dict[str, Any]]:
        teams = []
        cards = re.findall('\\{\\{TeamCard\\b(.*?)(?:\\n\\}\\}|\\n\\{\\{TeamCard\\b)', wikitext, re.DOTALL | re.IGNORECASE)
        for card_body in cards:
            params = WikitextParser._split_template_params(card_body)
            team_name = params.get('team')
            if not team_name:
                continue
            team_name = re.sub('\\[\\[(?:[^|]*\\|)?([^\\]]+)\\]\\]', '\\1', team_name).strip()
            if not team_name:
                continue
            players = []
            player_links = {}
            for k, v in params.items():
                link_match = re.match('^p(\\d+)link$', k)
                if link_match:
                    player_links[int(link_match.group(1))] = v.strip()
            for k, v in params.items():
                player_match = re.match('^p(\\d+)$', k)
                if player_match:
                    p_idx = int(player_match.group(1))
                    handle = v.strip()
                    if not handle:
                        continue
                    page_name = player_links.get(p_idx, handle)
                    players.append({'idx': p_idx, 'player_id': page_name.lower(), 'handle': handle, 'role': 'Rifler'})
            coach = params.get('c') or params.get('coach')
            if players:
                teams.append({'team_name': team_name, 'players': sorted(players, key=lambda x: x['idx']), 'coach': coach})
        return teams

    @staticmethod
    def parse_prize_pool(wikitext: str) -> Dict[str, str]:
        placements: Dict[str, str] = {}
        slots = re.findall('\\{\\{Prize pool slot(.*?)\\}\\}', wikitext, re.DOTALL | re.IGNORECASE)
        for slot in slots:
            tokens = safe_split_params(slot)
            place = None
            team = None
            for token in tokens:
                if '=' in token:
                    k, v = token.split('=', 1)
                    k = k.strip().lower()
                    v_clean = re.sub('\\[\\[(?:[^|]*\\|)?([^\\]]+)\\]\\]', '\\1', v.strip()).strip()
                    if k == 'place' and v_clean:
                        place = v_clean
                    elif k in ('team', 'opponent1', 'lastvs1') and v_clean and (not team):
                        team = v_clean
                else:
                    clean_tok = re.sub('\\[\\[(?:[^|]*\\|)?([^\\]]+)\\]\\]', '\\1', token).strip()
                    if clean_tok.lower() not in ('prize pool slot', '') and (not team):
                        team = clean_tok
            if place and team:
                placements[team.lower()] = place
        return placements

    @staticmethod
    def parse_infobox_player(wikitext: str, fallback_handle: str) -> Dict[str, Any]:
        info = {'handle': fallback_handle, 'real_name': None, 'birth_date': None, 'nationality': None, 'photo_url': None, 'role': None}
        match = re.search('\\{\\{Infobox player(.*?)(?:\\n\\}\\}|\\n\\{\\{)', wikitext, re.DOTALL | re.IGNORECASE)
        if not match:
            return info
        params = WikitextParser._split_template_params(match.group(1))
        if params.get('id'):
            info['handle'] = params['id']
        if params.get('name'):
            info['real_name'] = params['name']
        elif params.get('romanizedname'):
            info['real_name'] = params['romanizedname']
        if params.get('birth_date'):
            info['birth_date'] = params['birth_date']
        elif params.get('birthdate'):
            info['birth_date'] = params['birthdate']
        if params.get('country'):
            info['nationality'] = params['country']
        elif params.get('nationality'):
            info['nationality'] = params['nationality']
        if params.get('image'):
            info['photo_url'] = build_liquipedia_image_url(params['image'])
        if params.get('role'):
            info['role'] = params['role']
        elif params.get('roles'):
            info['role'] = params['roles']
        return info
