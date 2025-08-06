const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

// Erstelle Beispieltabellen
db.serialize(() => {
  // Users Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    age INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Products Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    in_stock INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Orders Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    total_price REAL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  // Beispieldaten einfügen
  const users = [
    ['Max Mustermann', 'max@example.com', 30],
    ['Anna Schmidt', 'anna@example.com', 25],
    ['Tom Weber', 'tom@example.com', 35],
    ['Lisa Müller', 'lisa@example.com', 28]
  ];

  const stmt1 = db.prepare("INSERT OR IGNORE INTO users (name, email, age) VALUES (?, ?, ?)");
  users.forEach(user => stmt1.run(user));
  stmt1.finalize();

  const products = [
    ['Laptop', 999.99, 'Electronics'],
    ['Smartphone', 599.99, 'Electronics'],
    ['Buch', 19.99, 'Books'],
    ['Kopfhörer', 149.99, 'Electronics'],
    ['Schreibtisch', 299.99, 'Furniture']
  ];

  const stmt2 = db.prepare("INSERT OR IGNORE INTO products (name, price, category) VALUES (?, ?, ?)");
  products.forEach(product => stmt2.run(product));
  stmt2.finalize();

  const orders = [
    [1, 1, 1, 999.99],
    [2, 2, 1, 599.99],
    [3, 3, 2, 39.98],
    [1, 4, 1, 149.99]
  ];

  const stmt3 = db.prepare("INSERT OR IGNORE INTO orders (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)");
  orders.forEach(order => stmt3.run(order));
  stmt3.finalize();

  console.log('Beispieldatenbank wurde erstellt!');
});

db.close();
