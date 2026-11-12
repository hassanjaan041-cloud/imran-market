import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  if (!state || !state.cart) return <div className="panel"><h3>Cart is empty</h3><button onClick={() => navigate('/store')} className="btn-primary">Go back to Store</button></div>;

  const { cart, currency, products } = state;
  const cartItems = products.filter(p => cart[p.id]);
  const rates = { USD: 278, EUR: 300, GBP: 352, AED: 76, CAD: 205, AUD: 183 };
  const rate = rates[currency] || 278;
  const subtotalPkr = cartItems.reduce((s, p) => s + p.sell_price * cart[p.id], 0);
  const shippingPkr = 4500;
  const totalPkr = subtotalPkr + shippingPkr;
  const totalDisplay = (totalPkr / rate).toFixed(2);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    const fd = new FormData(e.target);
    const items = cartItems.map(p => ({ product_id: p.id, quantity: cart[p.id] }));
    const payload = { customer_name: fd.get('name'), customer_email: fd.get('email'), customer_phone: fd.get('phone'), shipping_address: fd.get('address'), city: fd.get('city'), country: fd.get('country'), postal_code: fd.get('postal'), currency, items, notes: '' };
    try {
      const res = await fetch('/api/intl/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { setSuccess(data); localStorage.removeItem('cart'); } else { alert(data.error || 'Failed'); }
    } catch (err) { alert('Network error'); } finally { setLoading(false); }
  };

  if (success) return (
    <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
      <h2 style={{ color: '#16a34a', marginBottom: 16 }}>✅ Order Placed Successfully!</h2>
      <p>Your Order Code: <b>{success.order_code}</b></p>
      <p>Total: {currency} {success.total_display}</p>
      <p className="muted" style={{ marginTop: 16 }}>We will contact you at your email for shipping details.</p>
      <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/store')}>Back to Store</button>
    </div>
  );

  return (
    <div>
      <h2 className="page-title">Checkout</h2>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <form className="panel" onSubmit={submit}>
          <h3>Shipping Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input required name="name" placeholder="Full Name" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            <input required type="email" name="email" placeholder="Email Address" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            <input name="phone" placeholder="Phone Number" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            <input required name="address" placeholder="Street Address" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <input required name="city" placeholder="City" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6, flex: 1 }} />
              <input name="postal" placeholder="Postal Code" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6, flex: 1 }} />
            </div>
            <input required name="country" placeholder="Country" style={{ padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
            <button className="btn-primary" disabled={loading} style={{ marginTop: 10 }}>{loading ? 'Processing...' : 'Place Order'}</button>
          </div>
        </form>
        <div className="panel">
          <h3>Order Summary</h3>
          <table className="table" style={{ marginBottom: 16 }}>
            <tbody>
              {cartItems.map(p => <tr key={p.id}><td>{p.name} x {cart[p.id]}</td><td style={{ textAlign: 'right' }}>{currency} {(p.sell_price * cart[p.id] / rate).toFixed(2)}</td></tr>)}
            </tbody>
          </table>
          <div style={{ borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><b>{currency} {(subtotalPkr / rate).toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><b>{currency} {(shippingPkr / rate).toFixed(2)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, marginTop: 8 }}><span>Total</span><b style={{ color: '#2563eb' }}>{currency} {totalDisplay}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}