import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Properties from './pages/Properties.jsx';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('shop-theme') || 'light';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('shop-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>🏪</span>
          <div>
            <h1>Imran Market</h1>
            <small>Rent Manager</small>
          </div>
        </div>
        
        <nav>
          <NavLink to="/" end>📊 Dashboard</NavLink>
          <NavLink to="/properties">🏠 Rental Properties</NavLink>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <button onClick={toggleTheme} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}>
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </aside>
      
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}