import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const CURRENCIES = { USD: 278, EUR: 300, GBP: 352, AED: 76, CAD: 205, AUD: 183 };

export default function Store() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState(() => localStorage.getItem('shop-theme') || 'light');
  const navigate = useNavigate();

  // Theme lagane ka logic
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('shop-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    fetch('/api/public/products').then(r => r.json()).then(setProducts);
    const saved = localStorage.getItem('cart'); if (saved) setCart(JSON.parse(saved));
  }, []);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const rate = CURRENCIES[currency];
  const fmtLocal = (pkr) => `${currency} ${(pkr / rate).toFixed(2)}`;
  const add = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const inc = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id) => setCart(c => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });

  const cartItems = products.filter(p => cart[p.id]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>🏪 Home Decor Store</h2>
          <p className="muted">Browse our collection • Ships worldwide</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Customer ke liye Theme Button */}
          <button onClick={toggleTheme} className="btn-secondary" style={{ padding: '8px 12px' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          
          <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'var(--panel-bg)', color: 'var(--text-color)' }}>
            {Object.keys(CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn-primary" disabled={cartItems.length === 0} onClick={() => navigate('/checkout', { state: { cart, currency, products } })}>
            🛒 Cart ({cartItems.reduce((s, p) => s + cart[p.id], 0)})
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {products.map(p => (
          <div key={p.id} className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
            {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} /> : <div style={{ width: '100%', height: 180, background: 'var(--border-color)', borderRadius: 8, marginBottom: 12, display: 'grid', placeItems: 'center', fontSize: 48 }}>🖼️</div>}
            <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10, flex: 1 }}>{p.description || p.category}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>{fmtLocal(p.sell_price)}</p>
            {cart[p.id] ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <button className="btn-small" onClick={() => dec(p.id)}>-</button><span>{cart[p.id]}</span><button className="btn-small" onClick={() => inc(p.id)}>+</button>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => add(p.id)}>Add to Cart</button>
            )}
          </div>
        ))}
        {products.length === 0 && <p className="muted">No products available right now.</p>}
      </div>
    </div>
  );
}