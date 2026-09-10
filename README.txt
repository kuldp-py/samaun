Exact fix based on the complete Samaun project ZIP supplied by the user.

Changes only:
1. Fix admin login Set-Cookie response in functions/api/[[path]].js.
2. Stop Admin from calling protected APIs before login.
3. Show the actual admin error on the login screen.

No D1 schema/data, secrets, customer logic, product data, or R2 changes.
