"""Collect RSS/Atom metadata, then insert unseen URLs into Supabase."""
import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 5_000_000

class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.hidden += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.hidden = max(0, self.hidden - 1)
    def handle_data(self, data):
        if not self.hidden: self.parts.append(data)

def plain(value, limit):
    if limit <= 0: return ''
    parser = PlainText(); parser.feed(value or '')
    text = ' '.join(' '.join(parser.parts).split())
    return text if len(text) <= limit else text[:limit].rsplit(' ', 1)[0] + '…'

def canonical_url(value):
    p = urllib.parse.urlsplit(value.strip())
    if p.scheme not in ('http', 'https') or not p.hostname or p.username or p.password:
        raise ValueError('Invalid article URL')
    query = [(k, v) for k, v in urllib.parse.parse_qsl(p.query, keep_blank_values=True)
             if not k.lower().startswith('utm_') and k.lower() not in ('fbclid', 'gclid')]
    return urllib.parse.urlunsplit((p.scheme.lower(), p.netloc.lower(), p.path, urllib.parse.urlencode(query), ''))

def local(tag): return tag.split('}')[-1]

def child_text(entry, names):
    for name in names:
        for child in entry:
            if local(child.tag) == name and child.text:
                return child.text
    return ''

def date_value(value):
    if not value: return None
    try:
        try: dt = parsedate_to_datetime(value)
        except (TypeError, ValueError): dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat()
    except (TypeError, ValueError, OverflowError): return None

def category_for(entry, source):
    fixed = source.get('category')
    if fixed and fixed != 'auto': return fixed
    tags = ' '.join((c.text or c.attrib.get('term', '')) for c in entry if local(c.tag) == 'category').lower()
    title = child_text(entry, ['title']).lower()
    for text in (tags, title):
        if re.search(r'\b(tv|television|series|episode|season)\b', text): return 'TV Series'
        if re.search(r'\b(movie|movies|film|films|cinema|box office)\b', text): return 'Movies'
        if re.search(r'\b(game|games|gaming|playstation|xbox|nintendo|steam)\b', text): return 'Gaming'
    return 'Entertainment'

def parse_feed(data, source):
    if b'<!DOCTYPE' in data.upper() or b'<!ENTITY' in data.upper():
        raise ValueError('Feed contains unsupported XML declarations')
    root = ET.fromstring(data)
    if local(root.tag) not in ('rss', 'feed', 'RDF'): raise ValueError('Response is not RSS or Atom')
    rows = {}
    for entry in (e for e in root.iter() if local(e.tag) in ('item', 'entry')):
        title = plain(child_text(entry, ['title']), 500)
        link = child_text(entry, ['link'])
        if not link:
            link = next((c.attrib.get('href', '') for c in entry if local(c.tag) == 'link' and c.attrib.get('rel', 'alternate') == 'alternate'), '')
        try: url = canonical_url(link)
        except ValueError: continue
        if not title: continue
        allowed = source.get('article_hosts', [])
        if allowed and urllib.parse.urlsplit(url).hostname not in allowed: continue
        rows[url] = dict(title=title, summary=plain(child_text(entry, ['description', 'summary']), source.get('summary_chars', 180)),
                         category=category_for(entry, source), source_name=source['name'], source_url=url,
                         published_at=date_value(child_text(entry, ['pubDate', 'published', 'updated', 'date'])))
        if len(rows) >= 60: break
    return list(rows.values())

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'PeppermoonRSS/1.0', 'Accept': 'application/rss+xml, application/atom+xml, application/xml'})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES: raise ValueError('Feed too large')
    return data

def save(rows):
    base = os.environ['SUPABASE_URL'].rstrip('/')
    key = os.environ['SUPABASE_SECRET_KEY']
    if urllib.parse.urlsplit(base).scheme != 'https': raise ValueError('SUPABASE_URL must use HTTPS')
    headers = {'apikey': key, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal'}
    if key.startswith('eyJ'): headers['Authorization'] = 'Bearer ' + key
    req = urllib.request.Request(base + '/rest/v1/news_items?on_conflict=source_url', data=json.dumps(rows).encode(), headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=30) as response: response.read()

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--dry-run', action='store_true'); args = ap.parse_args()
    if not args.dry_run and not all(os.getenv(k) for k in ('SUPABASE_URL', 'SUPABASE_SECRET_KEY')):
        raise SystemExit('Add SUPABASE_URL and SUPABASE_SECRET_KEY to GitHub Actions secrets first.')
    sources = json.loads((ROOT / 'news-sources.json').read_text())
    successes = 0; failures = 0
    for source in sources:
        if not source.get('enabled', True): continue
        try:
            rows = parse_feed(fetch(source['feed_url']), source)
            if not rows: raise ValueError('Feed contained no usable stories')
            if not args.dry_run: save(rows)
            successes += 1
            print(f"{source['name']}: {len(rows)} stories {'validated' if args.dry_run else 'processed (existing URLs skipped)'}")
        except Exception as exc:
            failures += 1
            # Never print request headers, credential values, or database response bodies.
            detail = f'HTTP {exc.code}' if isinstance(exc, urllib.error.HTTPError) else type(exc).__name__
            print(f"::error::{source['name']}: {detail}; check feed availability and database setup.", file=sys.stderr)
    if not successes or failures: raise SystemExit(1)

if __name__ == '__main__': main()
