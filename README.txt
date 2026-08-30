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
