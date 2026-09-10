Samaun Admin Control Room Navigation Fix

Replace only:
  src/main.jsx
  src/style.css

This patch:
- Adds "Control room" beside "Logged as Admin" in the header.
- Keeps the header controls aligned on one line.
- Clicking "Control room" returns to the admin dashboard.
- Keeps the existing single admin Sign out button.
- Does not change backend, D1, authentication secrets, or product data.

Deploy with GitHub Desktop by committing and pushing to main.
