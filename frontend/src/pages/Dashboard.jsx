import { useEffect, useState } from 'react';

const fmt = (n) => `PKR ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const getCurrentMonth = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const loadDashboard = (month) => {
    fetch(`/api/dashboard-rent?month=${month}`)
      .then(r => {
        if (!r.ok) throw new Error('Network error');
        return r.json();
      })
      .then(resData => setData(resData))
      .catch(err => {
        console.error(err);
        setError(true);
      });
  };

  useEffect(() => {
    loadDashboard(selectedMonth);
    const interval = setInterval(() => loadDashboard(selectedMonth), 10000);
    return () => clearInterval(interval);
  }, [selectedMonth]);

  const handleStatusChange = async (paymentId, isPaid) => {
    if (!paymentId) {
      alert("Is dukan ka is mahine ka koi record nahi hai. Pehle 'Rental Properties' mein jaakar mahina add karein.");
      return;
    }
    await fetch(`/api/rental-payments/${paymentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: isPaid })
    });
    loadDashboard(selectedMonth);
  };

  if (error) return <div style={{padding: 20, color: 'red'}}>Backend se connect nahi ho raha.</div>;
  if (!data) return <div style={{padding: 20}}>Loading...</div>;

  const [year, monthNum] = data.currentMonth.split('-');
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  const shortMonth = monthNames[parseInt(monthNum) - 1].slice(0, 3);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
        <h2 className="page-title" style={{ margin: 0, textAlign: 'center', fontSize: '20px' }}>
          Dashboard <span className="muted" style={{ fontSize: '14px' }}>({monthName})</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--panel-bg)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <b style={{ fontSize: '13px' }}>Mahina:</b>
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-color)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }} />
        </div>
      </div>
      
      <div className="grid" style={{ gap: '10px', marginBottom: '15px' }}>
        <div className="card card-green" style={{ padding: '15px' }}>
          <p className="card-title" style={{ fontSize: '11px' }}>Rent Mil Gaya (Paid)</p>
          <p className="card-value" style={{ fontSize: '20px', margin: '5px 0' }}>{data.paidShops} / {data.totalShops}</p>
          <p className="card-sub" style={{ fontSize: '12px' }}>Jama: {fmt(data.totalCollected)}</p>
        </div>
        
        <div className="card card-red" style={{ padding: '15px' }}>
          <p className="card-title" style={{ fontSize: '11px' }}>Rent Baqi Hai (Pending)</p>
          <p className="card-value" style={{ fontSize: '20px', margin: '5px 0' }}>{data.pendingShops} / {data.totalShops}</p>
          <p className="card-sub" style={{ fontSize: '12px' }}>Baqi: {fmt(data.totalPending)}</p>
        </div>

        <div className="card card-blue" style={{ padding: '15px' }}>
          <p className="card-title" style={{ fontSize: '11px' }}>Total Expected Rent</p>
          <p className="card-value" style={{ fontSize: '20px', margin: '5px 0' }}>{fmt(data.totalCollected + data.totalPending)}</p>
          <p className="card-sub" style={{ fontSize: '12px' }}>{data.totalShops} Dukanon ka kiraya</p>
        </div>
      </div>

      <div className="panel" style={{ padding: '15px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '15px', fontSize: '16px' }}>🏠 Dukanon ka Status</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.shops.map(shop => (
            <div key={shop.id} style={{ background: 'var(--bg-color)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '15px' }}>{shop.name}</b>
                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '12px' }}>
                  {shop.tenant_due_date ? `${shop.tenant_due_date} ${shortMonth}` : '-'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{fmt(shop.monthly_rent)}</span>
                  {shop.is_paid === 1 ? (
                    <span style={{ color: '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>✅ Occupied</span>
                  ) : (
                    <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 'bold' }}>❌ Pending</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-small btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStatusChange(shop.payment_id, 1)}>YES</button>
                  <button className="btn-small btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStatusChange(shop.payment_id, 0)}>NO</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}