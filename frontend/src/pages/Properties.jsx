import { useEffect, useState } from 'react';
const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Properties() {
  const [props, setProps] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [detail, setDetail] = useState(null);
  
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editForm, setEditForm] = useState({ month: '', amount: '' });
  const [newShop, setNewShop] = useState({ name: '', monthly_rent: '', address: '' });

  // Saari dukanon ka data load karein
  const load = () => fetch('/api/properties').then(r => r.json()).then(setProps);
  useEffect(() => { load(); }, []);

  // Jab kisi dukan ko select karein toh uski details load karein
  useEffect(() => {
    if (selectedShop) {
      fetch(`/api/properties/${selectedShop.id}`).then(r => r.json()).then(setDetail);
    }
  }, [selectedShop]);

  // Naya Dukan Add karein
  const addNewShop = async (e) => {
    e.preventDefault();
    await fetch('/api/properties', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newShop)
    });
    setNewShop({ name: '', monthly_rent: '', address: '' });
    load();
  };

  // Dukan ka Naam, Address aur Rent Update karein
  const updateShop = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await fetch(`/api/properties/${selectedShop.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: fd.get('shop_name'), 
        address: fd.get('address'), 
        monthly_rent: Number(fd.get('rent')) 
      })
    });
    setSelectedShop(null); setDetail(null); load();
  };

  // Naya Mahina Add karein (Amount automatic rent se aayega)
  const addMonthRecord = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await fetch(`/api/properties/${selectedShop.id}/payments`, { 
      method: 'POST', headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        month: fd.get('month'), 
        amount: detail.property.monthly_rent, // Yahan automatic dukan ka rent uthaya gaya hai
        paid: 0, 
        due_date: detail.tenant?.lease_end || '' 
      }) 
    });
    fetch(`/api/properties/${selectedShop.id}`).then(r => r.json()).then(setDetail); 
  };

  const setPaymentStatus = async (paymentId, isPaid) => { 
    await fetch(`/api/rental-payments/${paymentId}`, { 
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ paid: isPaid }) 
    }); 
    load();
    if (selectedShop) fetch(`/api/properties/${selectedShop.id}`).then(r => r.json()).then(setDetail);
  };

  const saveTenant = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { name: fd.get('name'), phone: '', email: '', lease_start: '', lease_end: fd.get('due_day'), deposit: 0 };
    
    if (detail.tenant) {
      await fetch(`/api/tenants/${detail.tenant.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
    } else {
      await fetch(`/api/properties/${selectedShop.id}/tenant`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
    }
    load();
    fetch(`/api/properties/${selectedShop.id}`).then(r => r.json()).then(setDetail);
  };

  const saveEdit = async (id) => {
    await fetch(`/api/rental-payments/${id}/edit`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: editForm.month, amount: Number(editForm.amount) })
    });
    setEditingPaymentId(null);
    fetch(`/api/properties/${selectedShop.id}`).then(r => r.json()).then(setDetail);
  };

  const deleteMonth = async (id) => {
    if(!window.confirm("Kya aap waqai ye record delete karna chahte hain?")) return;
    await fetch(`/api/rental-payments/${id}`, { method: 'DELETE' });
    fetch(`/api/properties/${selectedShop.id}`).then(r => r.json()).then(setDetail);
  };

  return (
    <div>
      <h2 className="page-title" style={{ textAlign: 'center', fontSize: '22px', marginBottom: '15px' }}>Rental Properties</h2>
      
      {/* NAYA DUKAN ADD KARNE KA FORM */}
      <div className="panel" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '15px' }}>
        <h3 style={{ marginBottom: 15, fontSize: '16px' }}>➕ Naya Dukan (Shop) Add Karein</h3>
        <form className="form-row" onSubmit={addNewShop}>
          <input placeholder="Dukan ka Naam" value={newShop.name} onChange={e => setNewShop({...newShop, name: e.target.value})} required />
          <input placeholder="Address" value={newShop.address} onChange={e => setNewShop({...newShop, address: e.target.value})} />
          <input type="number" placeholder="Monthly Rent (PKR)" value={newShop.monthly_rent} onChange={e => setNewShop({...newShop, monthly_rent: e.target.value})} required />
          <button className="btn-primary" type="submit">Add Shop</button>
        </form>
      </div>

      {/* MAIN LIST (Mobile Cards) */}
      <div className="panel" style={{ padding: '15px' }}>
        <h3 style={{ marginBottom: 15, fontSize: '16px' }}>📋 Saari Dukanein</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {props.map(p => (
            <div key={p.id} style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: '15px' }}>{p.name}</b><br/>
                <small className="muted">{p.tenant_name || 'Khaali'}</small>
                {p.tenant_due_date && <div style={{ fontSize: '11px', color: 'var(--primary-color)', marginTop: '4px' }}>Date: {p.tenant_due_date}</div>}
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '4px' }}>{fmt(p.monthly_rent)}</div>
              </div>
              <button className="btn-primary" style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => setSelectedShop(p)}>Manage</button>
            </div>
          ))}
        </div>
      </div>

      {/* MANAGE SECTION */}
      {selectedShop && detail && (
        <div className="panel" style={{ marginTop: 15, border: '2px solid var(--primary-color)', padding: '15px' }}>
          
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
            <form onSubmit={updateShop} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ marginBottom: 5, fontSize: '15px' }}>🏪 Shop Details Update Karein</h4>
              <input name="shop_name" defaultValue={detail.property.name} placeholder="Shop Name" required />
              <input name="address" defaultValue={detail.property.address || ''} placeholder="Address" />
              <input name="rent" type="number" defaultValue={detail.property.monthly_rent} required placeholder="Monthly Rent" />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" type="submit" style={{ flex: 1 }}>Update</button>
                <button className="btn-secondary" type="button" onClick={() => { setSelectedShop(null); setDetail(null); }} style={{ flex: 1 }}>Close</button>
              </div>
            </form>
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <form className="form-row" onSubmit={saveTenant} style={{ padding: '10px', background: 'var(--bg-color)', borderRadius: 8 }}>
              <h4 style={{ width: '100%', marginBottom: 10, fontSize: '15px' }}>{detail.tenant ? '👤 Edit Dukandar & Date' : '👤 Naya Dukandar Add Karein'}</h4>
              <label style={{ width: '100%', fontSize: '13px' }}>Dukandar ka Naam</label>
              <input name="name" defaultValue={detail.tenant?.name} placeholder="Naam" required />
              <label style={{ width: '100%', fontSize: '13px' }}>Har mahine kis tareekh ko rent dena hai? (1-31)</label>
              <input name="due_day" type="number" min="1" max="31" defaultValue={detail.tenant?.lease_end || 10} required />
              <button className="btn-primary" type="submit">Save Details</button>
            </form>
          </div>

          {/* NAYA MAHINA ADD (Amount box nahi hai) */}
          <form className="form-row" onSubmit={addMonthRecord} style={{ marginBottom: 15, padding: '10px', background: 'var(--bg-color)', borderRadius: 8 }}>
            <h4 style={{ width: '100%', marginBottom: 10, fontSize: '15px' }}>💰 Naya Mahina Add Karein (Rent: {fmt(detail.property.monthly_rent)})</h4>
            <label style={{ width: '100%', fontSize: '13px' }}>Kis Mahine ka?</label>
            <input name="month" type="month" required />
            <button className="btn-primary" type="submit">Add Record</button>
          </form>

          <h4 style={{ marginBottom: 10, fontSize: '15px' }}>📜 Rent History</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {detail.payments.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {editingPaymentId === p.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="month" value={editForm.month} onChange={e => setEditForm({...editForm, month: e.target.value})} />
                    <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-small btn-primary" onClick={() => saveEdit(p.id)} style={{ flex: 1 }}>Save</button>
                      <button className="btn-small" onClick={() => setEditingPaymentId(null)} style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <b style={{ fontSize: '14px' }}>{p.month}</b>
                      <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{fmt(p.amount)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className={`badge ${p.paid ? 'badge-green' : 'badge-red'}`} style={{ marginBottom: '5px' }}>
                          {p.paid ? '✅ Yes' : '❌ No'}
                        </span>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                          <button className={`btn-small ${p.paid === 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPaymentStatus(p.id, 1)}>YES</button>
                          <button className={`btn-small ${p.paid === 0 ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setPaymentStatus(p.id, 0)}>NO</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button className="btn-small" onClick={() => { setEditingPaymentId(p.id); setEditForm({ month: p.month, amount: p.amount }); }}>✏️ Edit</button>
                        <button className="btn-small btn-danger" onClick={() => deleteMonth(p.id)}>🗑️ Delete</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {detail.payments.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Abhi koi record nahi hai.</p>}
          </div>
        </div>
      )}
    </div>
  );
}