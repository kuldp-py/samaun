# Samaun — Cloudflare launch build

This is the market-ready MVP architecture for Samaun using Cloudflare Pages + Pages Functions/Workers + D1 + R2 + direct UPI.

## What is included
- Premium Uttarakhand/Himalayan storefront
- Product catalogue, search and categories
- Cart and checkout
- Server-side order creation through D1
- Stock decrement when an order is created
- Direct UPI QR/deep link
- UTR submission
- Full admin login
- Admin dashboard, products, inventory, orders and payment verification
- R2 product-image endpoint
- D1 relational schema and indexes

## Free-tier target
Cloudflare currently lists Workers Free with D1 at 5 million rows read/day, 100,000 rows written/day and 5 GB stored data. R2 currently includes 10 GB-month storage, 1 million Class A requests, 10 million Class B requests and free internet egress per month. Static Pages assets are free/unlimited; Pages Functions count against Workers limits. See official pricing pages before launch.

## Setup
1. Create/login to Cloudflare.
2. Install Wrangler: `npm i -g wrangler`
3. Run `wrangler login`.
4. Create D1: `wrangler d1 create samaun-db` and copy the database ID into `wrangler.toml`.
5. Create R2 bucket: `wrangler r2 bucket create samaun-images`.
6. Run migration locally/remote: `wrangler d1 migrations apply samaun-db --remote`.
7. Set secrets:
   - `wrangler pages secret put ADMIN_PASSWORD --project-name samaun-store`
   - `wrangler pages secret put ADMIN_SESSION_SECRET --project-name samaun-store`
8. Update the UPI ID later from Admin > Settings, or seed it in D1.
9. Install dependencies: `npm install`.
10. Build: `npm run build`.
11. Create a Pages project and deploy: `npx wrangler pages deploy dist --project-name samaun-store`.

## Domain
In Cloudflare Pages, add `samaun.in` as a custom domain. If the domain remains registered at GoDaddy, you can either use Cloudflare nameservers or configure the DNS records Cloudflare provides.

## Important production notes
- Do NOT commit ADMIN_PASSWORD or ADMIN_SESSION_SECRET.
- Replace the placeholder UPI ID before taking real payments.
- Direct UPI is manually verified through UTR; it is not automatic gateway confirmation.
- Product images should be resized/compressed (WebP/AVIF recommended) before upload to stay comfortably within free storage.
- Before accepting significant order volume, add shipping calculation, cancellation/refund workflow, backups/export, audit logging and a proper business/payment reconciliation process.

## Recommended first launch
Start with 20–50 products, test the complete flow with a few real test orders, then add products and marketing based on actual demand.
