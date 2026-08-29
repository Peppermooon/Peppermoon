PEPPERMOON — ADMIN/USER ROLE FIX

IMPORTANT:
Run the SQL provided by ChatGPT before uploading this version.

What this version changes:
- admin.html only allows profiles with role = 'admin'
- normal logged-in users cannot enter Peppermoon Admin
- public login no longer invents a random username such as user_56db0504
- new public sign-ups use the username chosen during sign-up
- your existing admin account can still browse the public site normally

After SQL:
1. Set your existing admin profile role to: admin
2. Upload these files to GitHub
3. Test admin login
4. Log out from the public site
5. Create a new public user account and test it


MODAL SAFETY FIX
- Login / Sign-up no longer closes when clicking outside the dialog.
- Admin article/new-post editor no longer closes when clicking outside the editor.
- Data-entry dialogs now close only through their explicit close/cancel controls.
- Successful login can still close the login dialog after login completes.
