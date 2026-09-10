Samaun Admin Edit + Session Patch

Replace ONLY:
src/main.jsx

This patch:
- Keeps the admin session token while navigating away from /admin.
- Automatically restores the admin session when /admin is opened again in the same browser tab.
- Keeps customer Login separate from the admin session.
- Adds Edit Product.
- Adds editable compare-at price and tags.
- Allows changing the image_key for an existing product.
- Does not modify D1 data directly.
- Does not require R2.

Important:
The backend already needs to be the working Admin Auth Robust Fix version that returns an admin token. Do not replace the backend with an older version.

Image uploads:
Actual computer-file image upload will be added after Cloudflare R2 is enabled/bound. Until then, existing local image paths such as /product-food.svg can be changed through the Image key field.
