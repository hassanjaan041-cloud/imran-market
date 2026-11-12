import { useEffect, useState } from 'react';
const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const empty = { name: '', category: '', description: '', image_url: '', stock: 0, cost_price: 0, sell_price: 0, is_public: true };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const load = () => fetch('/api/inventory').then(r => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return alert('Name is required');
    const url = editing ? `/api/inventory/${editing}` : '/api/inventory';
    await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setForm(empty); setEditing(null); load();
  };
  const edit = (item) => { setForm({ name: item.name, category: item.category || '', description: item.description || '', image_url: item.image_url || '', stock: item.stock, cost_price: item.cost_price, sell_price: item.sell_price, is_public: !!item.is_public }); setEditing(item.id); };
  const remove = async (id) => { if (confirm('Delete this item?')) { await fetch(`/api/inventory/${id}`, { method: 'DELETE' }); load(); } };

  return (
    <div>
      <h2 className="page-title">Inventory</h2>
      <div className="panel">
        <h3>{editing ? '✏️ Edit Item' : '➕ Add New Item'}</h3>
        <form className="form-row" onSubmit={submit}>
          <input placeholder="Item name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Image URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
          <input type="number" step="0.01" placeholder="Cost" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
          <input type="number" step="0.01" placeholder="Sell price" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}><input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} /> Public</label>
          <button className="btn-primary" type="submit">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
        </form>
      </div>
      <div className="panel">
        <h3>📦 All Products</h3>
        <table className="table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Stock</th><th>Cost</th><th>Sell</th><th>Public</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id}>
                <td>{i.image_url ? <img src={i.image_url} alt="" style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 6 }} /> : '—'}</td>
                <td>{i.name}</td><td>{i.category}</td>
                <td style={{ color: i.stock <= 3 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{i.stock}</td>
                <td>{fmt(i.cost_price)}</td><td>{fmt(i.sell_price)}</td><td>{i.is_public ? '✅' : '—'}</td>
                <td><button className="btn-small" onClick={() => edit(i)}>Edit</button><button className="btn-small btn-danger" onClick={() => remove(i.id)}>Delete</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="8" className="muted" style={{ textAlign: 'center' }}>No products yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}