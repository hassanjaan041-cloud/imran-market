import { useEffect, useState } from 'react';
const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [form, setForm] = useState({ item_id: '', item_name: '', quantity: 1, price: '' });
  const [filter, setFilter] = useState({ from: '', to: '' });

  const load = () => {
    fetch('/api/sales').then(r => r.json()).then(setSales);
    fetch('/api/inventory').then(r => r.json()).then(setInventory);
  };
  useEffect(() => { load(); }, []);

  const handleItemChange = (id) => {
    const item = inventory.find(i => i.id === Number(id));
    setForm(f => ({ ...f, item_id: id, item_name: item ? item.name : '', price: item ? item.sell_price : '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.quantity || !form.price) return alert('Fill all fields');
    await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ item_id: form.item_id || null, item_name: form.item_name, quantity: Number(form.quantity), price: Number(form.price) }) });
    setForm({ item_id: '', item_name: '', quantity: 1, price: '' }); load();
  };

  const filtered = sales.filter(s => {
    const d = s.sold_at.slice(0, 10);
    if (filter.from && d < filter.from) return false;
    if (filter.to && d > filter.to) return false;
    return true;
  });
  const totalFiltered = filtered.reduce((s, x) => s + x.total, 0);

  return (
    <div>
      <h2 className="page-title">Sales</h2>
      <div className="panel">
        <h3>➕ Record New Sale</h3>
        <form className="form-row" onSubmit={submit}>
          <select value={form.item_id} onChange={e => handleItemChange(e.target.value)}>
            <option value="">-- Select from inventory --</option>
            {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.stock})</option>)}
          </select>
          <input placeholder="Item name" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} />
          <input type="number" min="1" placeholder="Qty" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          <input type="number" step="0.01" placeholder="Price each" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          <button type="submit" className="btn-primary">Add Sale</button>
        </form>
      </div>
      <div className="panel">
        <div className="panel-header">
          <h3>🧾 Sales History</h3>
          <div className="filter-row">
            <label>From <input type="date" value={filter.from} onChange={e => setFilter({ ...filter, from: e.target.value })} /></label>
            <label>To <input type="date" value={filter.to} onChange={e => setFilter({ ...filter, to: e.target.value })} /></label>
            <b>Total: {fmt(totalFiltered)}</b>
          </div>
        </div>
        <table className="table">
          <thead><tr><th>Date & Time</th><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            {filtered.map(s => <tr key={s.id}><td>{new Date(s.sold_at).toLocaleString()}</td><td>{s.item_name}</td><td>{s.quantity}</td><td>{fmt(s.price)}</td><td><b>{fmt(s.total)}</b></td></tr>)}
            {filtered.length === 0 && <tr><td colSpan="5" className="muted" style={{ textAlign: 'center' }}>No sales recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}