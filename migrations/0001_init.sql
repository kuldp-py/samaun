CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  category_id INTEGER,
  price INTEGER NOT NULL DEFAULT 0,
  compare_price INTEGER DEFAULT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_key TEXT DEFAULT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  tags TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  address TEXT NOT NULL,
  city TEXT DEFAULT '',
  state TEXT DEFAULT 'Uttarakhand',
  pincode TEXT DEFAULT '',
  items_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  utr TEXT DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  order_status TEXT NOT NULL DEFAULT 'payment_verification_pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

INSERT OR IGNORE INTO categories(name,slug,description) VALUES
('Food & Pantry','food-pantry','Himalayan foods, grains, spices and pantry favourites'),
('Handicrafts','handicrafts','Traditional crafts and handmade products from Uttarakhand'),
('Wellness','wellness','Natural and wellness products inspired by the Himalayas'),
('Home & Living','home-living','Uttarakhand-inspired products for your home'),
('Gifts','gifts','Curated gifts with a Himalayan touch');

INSERT OR IGNORE INTO settings(key,value) VALUES
('store_name','Samaun'),
('store_tagline','From the Himalayas, to your home.'),
('upi_id','SAMAUN-UPI-ID-HERE'),
('upi_name','Samaun');
