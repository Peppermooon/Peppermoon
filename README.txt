

PUBLIC UI FIX
- Light mode: text over dark/image card artwork remains white.
- Light mode: category labels over artwork remain white on dark translucent pills.
- Login / Sign up is now a strong rose/pink button with white text.
- Mobile public header reorganized to avoid crowded controls.
- Search/menu remain beside the brand; theme/login use a clean second row.
- Mobile cards, hero, community actions, comment/reply forms and filters are more responsive.
- Admin page intentionally unchanged.


COMMUNITY V4
- Saved menu now opens My Profile > Saved.
- Mobile menu now follows Light Mode.
- Follow / Unfollow.
- Followers / Following counts.
- Notifications for follow, like, comment, reply.
- New notifications.html page.
Run SUPABASE-FOLLOWS-NOTIFICATIONS-SETUP.sql first.


COMMUNITY LINK FIX
- URLs in community posts are automatically clickable.
- URLs in comments and replies are automatically clickable.
- Supports http://, https:// and www.
- Links open in a new tab.
- Existing HTML/XSS escaping remains in place.


GLOBAL URL LINKING
- URLs are clickable in official article plain-text fallback.
- URLs are clickable in community posts.
- URLs are clickable in comments and replies.
- URLs in profile activity previews are clickable.
- Links open in a new tab and use noopener/noreferrer/nofollow.
- Rich-text article links already created by the admin editor remain intact.


NAVIGATION CLEANUP BUILD
- Main public nav standardized to: Gaming / Movies / TV Series / Community / About.
- Trending removed from the global nav.
- Trending moved into Community feed controls.
- Community feed controls include Latest / Trending / Reviews / Discussions / Questions / Recommendations / News.
- Old trending.html redirects to community.html#trending.
- Gaming/Movie/TV article pages keep the parent section active.
- Profile and Notifications are treated as Community pages.
- Mobile hamburger keeps the same public nav set.
- Home hero remains the original dark hero in both Dark and Light Mode.
- Admin page remains separate and unchanged.
- No Supabase SQL required.


V5 POLISH
- Hero remains the same branded dark card in both themes.
- Original white/blush/rose/violet heading gradient preserved.
- Hero heading descender clipping fixed, including the lower parts of "pp".
- Profile duplicate/clashing public navigation removed.
- Community feed mode reduced to Latest and Trending only.
- Latest/Trending control placed immediately above the Community hero and made sticky while scrolling.
- Explore Trending on Home now opens Community Trending.
- No Supabase SQL required.
