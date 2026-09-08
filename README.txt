

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


V8.1 MOBILE + SHARE FIX
- Mobile header corrected to a single app-bar row.
- Peppermoon brand, theme, avatar/login, search and menu no longer collide.
- Feed vertical spacing reduced.
- Bottom navigation tuned for narrow phones.
- On GitHub Pages, Community Share uses post.html?slug=... so links do not 404.
- On Cloudflare Pages, Share automatically switches to /post/<slug> for rich OG previews.
- Official article share helper follows the same GitHub/Cloudflare behavior.
- Cloudflare OG output includes image secure URL and image dimensions.

IMPORTANT:
Post-specific Facebook/WhatsApp images require the Cloudflare share route to be deployed.
GitHub Pages can serve the post correctly but cannot dynamically send each post's unique OG image.


V8.2 SHARE PREVIEW FIX
- Replaced the fragile Pages ASSETS-fetch approach.
- /article/<slug> now returns crawler-ready OG metadata directly.
- /post/<slug> now returns crawler-ready OG metadata directly.
- Normal human browsers are redirected by JavaScript to article.html/post.html.
- Social crawlers remain on the metadata page and can read title/description/image.
- Added _routes.json so Functions run only for /article/* and /post/*.
- No Supabase SQL change required.

After uploading this build to GitHub, allow Cloudflare Pages to redeploy.
Then test the /article/<slug> route directly before testing Facebook.
