Samaun Admin Live Status Fix

Replace only src/main.jsx in the current project.

Fixes:
- Header immediately changes to “Logged as Admin” after successful admin login.
- Admin sign-out immediately updates the header.
- Admin session state stays synchronized between /admin and the main store UI.
- Existing admin refresh/session, edit, delete, and cart restrictions are preserved.
