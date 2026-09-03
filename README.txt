

PEPPERMOON V8 — MOBILE APP SHELL + SOCIAL SHARE PREVIEWS

MOBILE
- Hero hidden on mobile only. Desktop hero unchanged.
- Fixed bottom tabs: Home / Gaming / Movies / TV / Community.
- Mobile home is feed-first with a compact intro.

SHARE PREVIEWS
- Cloudflare Pages Functions added for /article/<slug> and /post/<slug>.
- They generate server-side Open Graph/Twitter metadata with each title, description and image.
- GitHub Pages cannot execute these functions. Deploy this same repo through Cloudflare Pages to activate rich Facebook/WhatsApp/etc previews.
- Supabase remains the backend.
