import { useEffect, useState } from 'react';
const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function Rent() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: 'Shop Rent', amount: '', type: 'rent', month: currentMonth() });
  const load = () => fetch('/api/rent').then(r => r.json()).then(setItems);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return alert('Fill all fields');
    await fetch('/api/rent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    setForm({ title: 'Shop Rent', amount: '', type: 'rent', month: currentMonth() }); load();
  };
  const togglePaid = async (item) => { await fetch(`/api/rent/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paid: !item.paid }) }); load(); };
  const remove = async (id) => { if (confirm('Delete?')) { await fetch(`/api/rent/${id}`, { method: 'DELETE' }); load(); } };

  return (
    <div>
      <h2 className="page-title">Rent & Expenses</h2>
      <div className="panel">
        <h3>➕ Add Expense</h3>
        <form className="form-row" onSubmit={submit}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="rent">Rent</option><option value="utility">Utility</option><option value="salary">Salary</option><option value="other">Other</option>
          </select>
          <input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
          <button className="btn-primary" type="submit">Add</button>
        </form>
      </div>
      <div className="panel">
        <h3>🧾 All Expenses</h3>
        <table className="table">
          <thead><tr><th>Title</th><th>Type</th><th>Month</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id}>
                <td>{i.title}</td><td style={{ textTransform: 'capitalize' }}>{i.type}</td><td>{i.month}</td><td><b>{fmt(i.amount)}</b></td>
                <td><span className={`badge ${i.paid ? 'badge-green' : 'badge-orange'}`}>{i.paid ? 'Paid' : 'Pending'}</span></td>
                <td><button className="btn-small" onClick={() => togglePaid(i)}>{i.paid ? 'Mark Pending' : 'Mark Paid'}</button><button className="btn-small btn-danger" onClick={() => remove(i.id)}>Delete</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="6" className="muted" style={{ textAlign: 'center' }}>No expenses recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}