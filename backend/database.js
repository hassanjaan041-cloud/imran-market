const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'shop.db'));

db.serialize(() => {
  // ---- Inventory ----
  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    cost_price REAL DEFAULT 0,
    sell_price REAL DEFAULT 0,
    currency TEXT DEFAULT 'PKR',
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ---- Local sales ----
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    total REAL NOT NULL,
    sold_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ---- Rent/expenses ----
  db.run(`CREATE TABLE IF NOT EXISTS rent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT DEFAULT 'rent',
    month TEXT NOT NULL,
    paid INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ---- Properties ----
  db.run(`CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    monthly_rent REAL NOT NULL,
    currency TEXT DEFAULT 'PKR',
    status TEXT DEFAULT 'vacant',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ---- Tenants ----
  db.run(`CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    lease_start TEXT,
    lease_end TEXT,
    deposit REAL DEFAULT 0
  )`);

  // ---- Rental payments (UPDATED WITH due_date) ----
  db.run(`CREATE TABLE IF NOT EXISTS rental_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    tenant_id INTEGER,
    month TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'PKR',
    paid INTEGER DEFAULT 0,
    paid_at DATETIME,
    due_date TEXT
  )`);

  // ---- International orders ----
  db.run(`CREATE TABLE IF NOT EXISTS intl_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    city TEXT,
    country TEXT NOT NULL,
    postal_code TEXT,
    currency TEXT NOT NULL,
    fx_rate REAL DEFAULT 1,
    subtotal_pkr REAL NOT NULL,
    shipping_pkr REAL DEFAULT 0,
    total_pkr REAL NOT NULL,
    total_display REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    tracking_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS intl_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_pkr REAL NOT NULL,
    line_total_pkr REAL NOT NULL
  )`);

  // ---- Seed 8 properties once ----
  db.get(`SELECT COUNT(*) AS c FROM properties`, (err, row) => {
    if (!err && row.c === 0) {
      const stmt = db.prepare(
        `INSERT INTO properties (name, address, monthly_rent, status) VALUES (?,?,?,?)`
      );
      for (let i = 1; i <= 8; i++) {
        stmt.run(`Shop #${i}`, `Market Area, Block ${i}`, 25000, 'vacant');
      }
      stmt.finalize();
      console.log('✅ Seeded 8 shop properties');
    }
  });
});

module.exports = db;