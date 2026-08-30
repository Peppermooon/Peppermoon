PEPPERMOON COMMUNITY V2 — COMMENTS + REPLIES + THEMES

NEW
- Comments under each community post
- Replies to comments
- Public visitors can read comments without login
- Login required only to comment/reply
- Users can delete their own comments/replies
- Admin can delete any comment/reply
- Dark mode remains the default
- New Light mode
- Theme choice is remembered in the browser across Peppermoon pages

NOT YET ACTIVE
- Likes
- Saves

SETUP
1. Run SUPABASE-COMMENTS-SETUP.sql in Supabase SQL Editor.
2. Upload all files to your GitHub repository root and replace the previous files.
3. Open Community.
4. Test a comment and a reply using a normal Google account.
5. Log out and confirm comments remain visible.
6. Test the Light/Dark toggle and reload the page to confirm the choice is remembered.


THEME FIX CHECK
- Fixed missing theme toggle JavaScript on community.html.
- Verified every HTML page containing the Light/Dark button also contains:
  * light-theme CSS
  * localStorage theme persistence
  * toggle JavaScript
- Dark remains the default.
- Selected theme persists after reload.


LIGHT MODE + PUBLIC LOGO POLISH
- Admin page intentionally left unchanged.
- Unified the Peppermoon header logo across all public pages.
- Removed image-based black-ring header logo variants.
- Header now uses the rose/violet moon with white highlight and a true side cutout.
- Light mode headings use near-black/dark navy.
- Light mode body text uses grey-blue.
- Light mode is mostly white with subtle grey cards.
- Fixed white/invisible navigation and menu/search icons in light mode.
- Added stronger light-mode overrides for article prose, comments, forms, menus, cards, footer and neutral buttons.
- Accent buttons remain white text on the pink/violet accent.


FINAL APPROVED LOGO + HOME HERO
- Approved transparent Peppermoon moon logo is now used across every public page.
- Same approved logo is used for favicon.png.
- Transparent lower-right cutout shows the actual background behind it.
- Admin page remains unchanged.
- Home "Welcome to Peppermoon" hero card remains in its original dark style even when Light Mode is active.
- Rest of the Light Mode keeps the polished white/subtle-grey appearance.
