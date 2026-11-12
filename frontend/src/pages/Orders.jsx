import { useEffect, useState } from 'react';
const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [detail, setDetail] = useState(null);
  const load = () => fetch('/api/intl/orders').then(r => r.json()).then(setOrders);
  useEffect(() => { load(); }, []);

  const open = (id) => fetch(`/api/intl/orders/${id}`).then(r => r.json()).then(setDetail);
  const updateStatus = async (id, status, tracking) => { await fetch(`/api/intl/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, tracking_number: tracking }) }); load(); if (detail && detail.order.id === id) open(id); };

  return (
    <div>
      <h2 className="page-title">🌍 International Orders</h2>
      <div className="panel">
        <table className="table">
          <thead><tr><th>Code</th><th>Customer</th><th>Country</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><b>{o.order_code}</b></td><td>{o.customer_name}<br /><small className="muted">{o.customer_email}</small></td><td>{o.country}</td>
                <td>{fmt(o.total_pkr)}<br /><small className="muted">{o.currency} {o.total_display}</small></td>
                <td><span className={`badge ${o.status === 'delivered' ? 'badge-green' : o.status === 'cancelled' ? 'badge-red' : 'badge-orange'}`}>{o.status}</span></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td><td><button className="btn-small" onClick={() => open(o.id)}>View</button></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="7" className="muted" style={{ textAlign: 'center' }}>No international orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {detail && (
        <div className="panel">
          <div className="panel-header"><h3>Order {detail.order.order_code}</h3><button className="btn-secondary" onClick={() => setDetail(null)}>Close</button></div>
          <p><b>Ship to:</b> {detail.order.shipping_address}, {detail.order.city}, {detail.order.country} {detail.order.postal_code}</p>
          <p><b>Contact:</b> {detail.order.customer_email} • {detail.order.customer_phone}</p>
          <h4 style={{ marginTop: 16 }}>Items</h4>
          <table className="table">
            <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
            <tbody>{detail.items.map(it => <tr key={it.id}><td>{it.product_name}</td><td>{it.quantity}</td><td>{fmt(it.unit_price_pkr)}</td><td>{fmt(it.line_total_pkr)}</td></tr>)}</tbody>
          </table>
          <p style={{ marginTop: 12 }}><b>Total:</b> {fmt(detail.order.total_pkr)} / {detail.order.currency} {detail.order.total_display}</p>
          <h4 style={{ marginTop: 20 }}>Update Status</h4>
          <div className="form-row">
            <select defaultValue={detail.order.status} onChange={e => updateStatus(detail.order.id, e.target.value, detail.order.tracking_number)}>
              {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Tracking number (optional)" defaultValue={detail.order.tracking_number || ''} onBlur={e => updateStatus(detail.order.id, detail.order.status, e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}