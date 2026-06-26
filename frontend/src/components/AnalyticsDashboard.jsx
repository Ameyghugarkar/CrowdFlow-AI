import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Users, TrendingUp, AlertOctagon, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function AnalyticsDashboard({ data }) {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (data.total_count) {
      setHistoryData(prev => {
        const newEntry = { time: new Date().toLocaleTimeString().substring(0, 5), count: data.total_count };
        const next = [...prev, newEntry];
        if (next.length > 20) next.shift();
        return next;
      });
    }
  }, [data.total_count]);

  const chartData = {
    labels: historyData.map(d => d.time),
    datasets: [{
      fill: true,
      label: 'Crowd Density Trend',
      data: historyData.map(d => d.count),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
    }
  };

  const activeAlertsCount = data.alerts?.length || 0;
  const maxRisk = Math.max(...Object.values(data.zones || {}).map(z => z.risk_score), 0);
  const totalCount = data.total_count || 0;
  const divergence = Math.round(Object.values(data.zones || {}).reduce((sum, z) => sum + Math.abs(z.divergence), 0) * 10) / 10 || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {/* Stat Cards */}
        <div style={{ background: '#1a2235', padding: 16, borderRadius: 12, border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>TOTAL CROWD COUNT</span>
            <Users size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 'bold', color: '#fff' }}>{totalCount}</div>
        </div>
        
        <div style={{ background: '#1a2235', padding: 16, borderRadius: 12, border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>PEAK ZONE RISK</span>
            <AlertOctagon size={16} color="#f97316" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 'bold', color: '#fff' }}>{Math.round(maxRisk)}%</div>
          <div style={{ fontSize: 12, color: '#f97316', marginTop: 4 }}>
            Highest in {Object.keys(data.zones || {}).find(k => data.zones[k].risk_score === maxRisk) || 'None'}
          </div>
        </div>
        
        <div style={{ background: '#1a2235', padding: 16, borderRadius: 12, border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>ACTIVE ALERTS</span>
            <AlertOctagon size={16} color={activeAlertsCount > 0 ? "#ef4444" : "#6b7280"} />
          </div>
          <div style={{ fontSize: 30, fontWeight: 'bold', color: activeAlertsCount > 0 ? '#ef4444' : '#fff', textShadow: activeAlertsCount > 0 ? '0 0 10px rgba(239,68,68,0.5)' : 'none' }}>
            {activeAlertsCount}
          </div>
        </div>
        
        <div style={{ background: '#1a2235', padding: 16, borderRadius: 12, border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>CROWD DIVERGENCE</span>
            <TrendingUp size={16} color="#a855f7" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 'bold', color: '#fff' }}>{divergence}</div>
          <div style={{ fontSize: 12, color: '#c084fc', marginTop: 4 }}>Flow volatility metric</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: '#1a2235', padding: 20, borderRadius: 12, border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <Activity color="#3b82f6" size={18} style={{ marginRight: 8 }} /> Crowd Density Trend
          </h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>

        <div style={{ background: '#1a2235', padding: 20, borderRadius: 12, border: '1px solid #1f2937', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Live Alert Feed</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.alerts?.length > 0 ? (
              data.alerts.map((alert, i) => (
                <div key={i} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: 12, borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#ef4444' }} />
                  <div style={{ fontWeight: 600, color: '#ef4444', fontSize: 14 }}>{alert.zone}</div>
                  <div style={{ fontSize: 12, color: '#d1d5db', marginTop: 4 }}>{alert.type}</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#6b7280', marginTop: 8 }}>{new Date().toLocaleTimeString()}</div>
                </div>
              ))
            ) : (
              <div style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>No active alerts detected</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
