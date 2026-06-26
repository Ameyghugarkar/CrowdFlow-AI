import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, Video, Map as MapIcon, AlertTriangle, Settings, Bell } from 'lucide-react';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CCTVMonitor from './components/CCTVMonitor';
import DensityHeatmap from './components/DensityHeatmap';
import EmergencyAlertCenter from './components/EmergencyAlertCenter';

const NAV = [
  { path: '/',        name: 'Analytics Dashboard', icon: <Activity size={20} /> },
  { path: '/cctv',   name: 'CCTV AI Monitor',      icon: <Video size={20} /> },
  { path: '/heatmap',name: 'Density Heatmap',       icon: <MapIcon size={20} /> },
  { path: '/alerts', name: 'Emergency Alerts',      icon: <AlertTriangle size={20} /> },
];

function Sidebar({ alertCount }) {
  const location = useLocation();
  return (
    <div style={{ width: 220, background: '#1a2235', borderRight: '1px solid #1f2937', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, background: '#2563eb', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>C</div>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>CrowdFlow AI</span>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', letterSpacing: 2, padding: '0 20px 16px', textTransform: 'uppercase' }}>
        Public Safety Platform v2.0
      </div>
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {NAV.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8, marginBottom: 4,
                background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                borderLeft: active ? '2px solid #60a5fa' : '2px solid transparent',
                color: active ? '#60a5fa' : '#9ca3af',
                fontWeight: active ? 600 : 400,
                fontSize: 14, transition: 'all 0.15s',
                position: 'relative',
              }}>
                {item.icon}
                <span>{item.name}</span>
                {item.path === '/alerts' && alertCount > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: '#ef4444', color: '#fff',
                    borderRadius: 999, width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                  }}>{alertCount}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: '12px 20px', borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6b7280' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <span style={{ fontSize: 13 }}>System Online</span>
        </div>
        <Settings size={16} style={{ cursor: 'pointer' }} />
      </div>
    </div>
  );
}

function TopHeader({ alertCount, wsStatus, clock }) {
  return (
    <div style={{ height: 56, background: '#0b0f19', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px', gap: 20, flexShrink: 0 }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#d1d5db' }}>{clock}</div>
        <div style={{ fontSize: 11, color: wsStatus === 'connected' ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
          {wsStatus === 'connected' ? 'Live Feed Connected' : '⚠ Connection Lost – Retrying…'}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <Bell size={20} color="#d1d5db" />
        {alertCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: '#fff', borderRadius: 999,
            width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700,
          }}>{alertCount}</span>
        )}
      </div>
    </div>
  );
}

const EMPTY = { zones: {}, alerts: [], evacuation_routes: [], total_count: 0, time_step: 0, demo_mode: false };

function App() {
  const [data, setData]         = useState(EMPTY);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [clock, setClock]       = useState('');
  const wsRef                   = useRef(null);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // WebSocket with auto-reconnect
  useEffect(() => {
    let cancelled = false;
    function connect() {
      if (cancelled) return;
      const ws = new WebSocket('ws://localhost:8000/ws/stream');
      wsRef.current = ws;
      ws.onopen    = () => setWsStatus('connected');
      ws.onclose   = () => { setWsStatus('disconnected'); if (!cancelled) setTimeout(connect, 2000); };
      ws.onerror   = () => ws.close();
      ws.onmessage = (e) => { try { setData(JSON.parse(e.data)); } catch {} };
    }
    connect();
    return () => { cancelled = true; wsRef.current?.close(); };
  }, []);

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh', background: '#0b0f19', color: '#fff', overflow: 'hidden' }}>
        <Sidebar alertCount={data.alerts?.length || 0} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopHeader alertCount={data.alerts?.length || 0} wsStatus={wsStatus} clock={clock} />
          <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            <Routes>
              <Route path="/"        element={<AnalyticsDashboard   data={data} />} />
              <Route path="/cctv"    element={<CCTVMonitor          data={data} />} />
              <Route path="/heatmap" element={<DensityHeatmap       data={data} />} />
              <Route path="/alerts"  element={<EmergencyAlertCenter data={data} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
