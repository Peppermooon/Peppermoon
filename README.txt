
PEPPERMOON V7 — COMMUNITY POST DETAIL
- Dedicated post.html page for every Community post.
- Full post page includes Like, Save, Share, Comments and Replies.
- Community titles/open button link to the dedicated post page.
- Stable post slugs use title + post ID.
- Existing posts are backfilled by SQL.
- This does NOT yet solve Facebook/WhatsApp rich previews on GitHub Pages; that needs the next server-side OG routing step.

SETUP
1. Run SUPABASE-POST-SLUG-SETUP.sql in Supabase SQL Editor.
2. Upload the V7 files to GitHub.
3. Test Community -> Open post -> full post page.
