Samaun User Name + Verified Purchase Review Fix

Replace ONLY:
  src/main.jsx
  functions/api/[[path]].js

Changes:
- Customer header shows the customer's name instead of "Account".
- Review form only appears with products from PAID customer orders.
- Backend independently blocks review submissions unless the customer has a paid order containing that product.
- PBKDF2 compatibility fix (100000 iterations) is preserved.
- Existing Admin UI and styling are preserved.

Deploy both files together via GitHub Desktop.
Do not change D1 schema or Cloudflare secrets.
