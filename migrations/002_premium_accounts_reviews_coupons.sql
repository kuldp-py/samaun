INSERT OR IGNORE INTO categories(name,slug,description,active) VALUES ('Premium','premium','Curated premium Himalayan products',1);

CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE orders ADD COLUMN customer_id INTEGER;
ALTER TABLE orders ADD COLUMN discount REAL NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN coupon_code TEXT;

CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, customer_id INTEGER NOT NULL, rating INTEGER NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', verified_purchase INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, discount_type TEXT NOT NULL DEFAULT 'percent', discount_value REAL NOT NULL DEFAULT 0, min_order REAL NOT NULL DEFAULT 0, max_discount REAL NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, starts_at TEXT, ends_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO coupons(code,discount_type,discount_value,min_order,max_discount,active) VALUES ('SAMAUN10','percent',10,499,500,1);

UPDATE products SET tags=CASE WHEN tags IS NULL OR tags='' THEN 'bestseller' ELSE tags||',bestseller' END WHERE name IN ('Mandua (Ragi) Atta – 1 kg','Himalayan Rajma – 500 g','Himalayan Honey – 250 g','Pahadi Namak – 200 g');
