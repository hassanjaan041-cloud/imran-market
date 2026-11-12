const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

/* ==========================================
   PROPERTIES (SHOPS)
========================================== */
app.get('/api/properties', (req, res) => {
  const query = `
    SELECT p.*, 
    (SELECT name FROM tenants WHERE property_id = p.id ORDER BY id DESC LIMIT 1) as tenant_name,
    (SELECT paid FROM rental_payments WHERE property_id = p.id ORDER BY id DESC LIMIT 1) as latest_paid,
    (SELECT id FROM rental_payments WHERE property_id = p.id ORDER BY id DESC LIMIT 1) as latest_payment_id
    FROM properties p 
    ORDER BY p.id
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/properties', (req, res) => {
  const { name, address, monthly_rent } = req.body;
  db.run(`INSERT INTO properties (name, address, monthly_rent, status) VALUES (?,?,?,?)`, 
  [name, address || '', monthly_rent, 'vacant'], 
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/api/properties/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM properties WHERE id=?`, [id], (e1, prop) => {
    if (!prop) return res.status(404).json({ error: 'Not found' });
    db.get(`SELECT * FROM tenants WHERE property_id=? ORDER BY id DESC LIMIT 1`, [id], (e2, tenant) => {
      db.all(`SELECT * FROM rental_payments WHERE property_id=? ORDER BY month DESC`, [id], (e3, payments) => {
        res.json({ property: prop, tenant: tenant || null, payments });
      });
    });
  });
});

app.put('/api/properties/:id', (req, res) => {
  const { name, address, monthly_rent } = req.body;
  db.run(`UPDATE properties SET name=?, address=?, monthly_rent=? WHERE id=?`, 
  [name, address || '', monthly_rent, req.params.id], 
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.post('/api/properties/:id/tenant', (req, res) => {
  const { name, phone, email, lease_start, lease_end, deposit } = req.body;
  const id = req.params.id;
  db.run(`INSERT INTO tenants (property_id, name, phone, email, lease_start, lease_end, deposit) VALUES (?,?,?,?,?,?,?)`, 
  [id, name, phone, email, lease_start, lease_end, deposit || 0], 
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run(`UPDATE properties SET status='occupied' WHERE id=?`, [id]);
    res.json({ id: this.lastID });
  });
});

app.put('/api/tenants/:id', (req, res) => {
  const { name, phone, email, lease_start, lease_end, deposit } = req.body;
  db.run(`UPDATE tenants SET name=?, phone=?, email=?, lease_start=?, lease_end=?, deposit=? WHERE id=?`, 
  [name, phone, email, lease_start, lease_end, deposit, req.params.id], 
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.post('/api/properties/:id/payments', (req, res) => {
  const { month, amount, paid, due_date } = req.body;
  const id = req.params.id;
  db.get(`SELECT id FROM tenants WHERE property_id=? ORDER BY id DESC LIMIT 1`, [id], (e, tenant) => {
    db.run(`INSERT INTO rental_payments (property_id, tenant_id, month, amount, paid, paid_at, due_date) VALUES (?,?,?,?,?,?,?)`, 
    [id, tenant?.id || null, month, amount, paid ? 1 : 0, paid ? new Date().toISOString() : null, due_date], 
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
  });
});

app.put('/api/rental-payments/:id', (req, res) => {
  const paid = req.body.paid ? 1 : 0;
  db.run(`UPDATE rental_payments SET paid=?, paid_at=? WHERE id=?`, 
  [paid, paid ? new Date().toISOString() : null, req.params.id], 
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.put('/api/rental-payments/:id/edit', (req, res) => {
  const { month, amount } = req.body;
  db.run(`UPDATE rental_payments SET month=?, amount=? WHERE id=?`, 
  [month, amount, req.params.id], 
  function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/rental-payments/:id', (req, res) => {
  db.run(`DELETE FROM rental_payments WHERE id=?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

/* ==========================================
   DASHBOARD ROUTE (AUTO-RECORD LOGIC)
========================================== */
app.get('/api/dashboard-rent', (req, res) => {
  const selectedMonth = req.query.month || new Date().toISOString().slice(0, 7);
  
  // 1. Check karein ke kis dukan ka record nahi bana
  const checkQuery = `
    SELECT p.id, p.name, p.monthly_rent,
    (SELECT id FROM rental_payments WHERE property_id = p.id AND month = ?) as payment_id
    FROM properties p
  `;
  
  db.all(checkQuery, [selectedMonth], (err, shops) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // 2. Jin dukanon ka record nahi hai, unka khud-ba-khud record banayein (Pending)
    let insertCount = 0;
    shops.forEach(shop => {
      if (!shop.payment_id) {
        insertCount++;
        db.run(`INSERT INTO rental_payments (property_id, month, amount, paid) VALUES (?,?,?,?)`, 
        [shop.id, selectedMonth, shop.monthly_rent, 0]);
      }
    });

    // 3. Jab record ban jayein, toh data wapas fetch karein
    setTimeout(() => {
      const query = `
        SELECT p.id, p.name, p.monthly_rent,
        (SELECT paid FROM rental_payments WHERE property_id = p.id AND month = ? ORDER BY id DESC LIMIT 1) as is_paid,
        (SELECT id FROM rental_payments WHERE property_id = p.id AND month = ? ORDER BY id DESC LIMIT 1) as payment_id,
        (SELECT lease_end FROM tenants WHERE property_id = p.id ORDER BY id DESC LIMIT 1) as tenant_due_date
        FROM properties p
      `;
      
      db.all(query, [selectedMonth, selectedMonth], (err2, rows) => {
        if (err2) return res.status(500).json({ error: err2.message });
        
        let paidShops = 0, pendingShops = 0, totalCollected = 0, totalPending = 0;

        rows.forEach(r => {
          if (r.is_paid === 1) {
            paidShops++;
            totalCollected += r.monthly_rent;
          } else {
            pendingShops++;
            totalPending += r.monthly_rent;
          }
        });

        res.json({
          currentMonth: selectedMonth, 
          totalShops: rows.length, paidShops, pendingShops, 
          totalCollected, totalPending, shops: rows
        });
      });
    }, 500); // 0.5 second delay taake insert complete ho jaye
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Rent Manager Backend running on http://localhost:${PORT}`));