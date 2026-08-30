PEPPERMOON — GOOGLE AUTH + SESSION UPDATE

WHAT CHANGED
- Added Continue with Google to public login/sign-up popup
- Google users return to Peppermoon already logged in
- Google profile name/avatar are used automatically
- A normal Peppermoon username is generated from the Google email if needed
- Public auth sessions explicitly persist and auto-refresh
- Email signup closes immediately when Supabase returns an active session
- Email confirmation remains supported
- Admin session explicitly persists and auto-refreshes
- Admin reload now shows "Checking your admin session..." instead of flashing the login page

BEFORE TESTING
Supabase Google provider must contain the valid Google OAuth Client ID and Client Secret.

Supabase Authentication > URL Configuration should allow:
https://peppermooon.github.io/Peppermoon/

TEST GOOGLE
1. Upload/replace these files on GitHub.
2. Open Peppermoon.
3. Click Log in / Sign up.
4. Click Continue with Google.
5. Select a Google account.
6. You should return to Peppermoon already logged in.
7. Check Supabase Authentication > Users and public.profiles.

TEST ADMIN
1. Open admin.html while already logged in as admin.
2. Reload several times.
3. It should show a brief session-check screen and then dashboard, not flash the login form.
