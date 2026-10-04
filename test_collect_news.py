import unittest
from unittest.mock import patch
import os
import collect_news as c

class FeedTests(unittest.TestCase):
    source = {'name':'Test', 'category':'auto', 'article_hosts':['example.com']}
    def test_rss_deduplicates_and_sanitizes(self):
        xml = b'''<rss><channel><item><title>A movie</title><link>https://example.com/story?utm_source=rss</link><description>&lt;script&gt;bad()&lt;/script&gt;&lt;p&gt;Safe summary&lt;/p&gt;</description><category>Movies</category><pubDate>Sun, 04 Oct 2026 10:00:00 GMT</pubDate></item><item><title>A movie</title><link>https://example.com/story#top</link><description>Safe summary</description><category>Movies</category></item></channel></rss>'''
        rows = c.parse_feed(xml, self.source)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['source_url'], 'https://example.com/story')
        self.assertEqual(rows[0]['category'], 'Movies')
        self.assertEqual(c.plain('<script>bad()</script><p>Safe summary</p>', 180), 'Safe summary')
    def test_atom_and_dates(self):
        xml = b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>New episode</title><link href="https://example.com/episode"/><published>2026-10-04T12:00:00Z</published><summary>Hello</summary></entry></feed>'
        row = c.parse_feed(xml, self.source)[0]
        self.assertEqual(row['category'], 'TV Series')
        self.assertEqual(row['published_at'], '2026-10-04T12:00:00+00:00')
        self.assertIsNone(c.date_value('bad'))
    def test_unsafe_and_wrong_host_links_skipped(self):
        for url in ['javascript:alert(1)', 'https://unrelated.com/story']:
            xml = f'<rss><channel><item><title>Story</title><link>{url}</link></item></channel></rss>'.encode()
            self.assertEqual(c.parse_feed(xml, self.source), [])
    def test_unavailable_and_entity_feeds_rejected(self):
        for xml in [b'<html><body>Unavailable</body></html>', b'<!DOCTYPE rss><rss/>']:
            with self.assertRaises(ValueError): c.parse_feed(xml, self.source)
    def test_insert_preserves_existing_hidden_rows(self):
        with patch.dict(os.environ, SUPABASE_URL='https://example.supabase.co', SUPABASE_SECRET_KEY='sb_secret_test'), patch.object(c.urllib.request, 'urlopen') as send:
            c.save([{'title':'Story'}])
            req = send.call_args.args[0]
            self.assertIn('on_conflict=source_url', req.full_url)
            self.assertEqual(req.get_header('Prefer'), 'resolution=ignore-duplicates,return=minimal')
            self.assertEqual(req.get_header('Apikey'), 'sb_secret_test')
            self.assertIsNone(req.get_header('Authorization'))

if __name__ == '__main__': unittest.main()
