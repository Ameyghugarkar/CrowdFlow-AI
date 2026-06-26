import React from 'react';
import { AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

const VENUE = {
  name: "Generic 4-Quadrant Sector Grid",
  zones: {
    "Top Sector": {
      x: 28, y: 2, w: 44, h: 18,
      exits: [],
      color: "#3b82f6",
    },
    "Left Sector": {
      x: 2, y: 20, w: 26, h: 60,
      exits: [],
      color: "#a855f7",
    },
    "Center Sector": {
      x: 28, y: 20, w: 44, h: 60,
      exits: [],
      color: "#facc15",
    },
    "Right Sector": {
      x: 72, y: 20, w: 26, h: 60,
      exits: [],
      color: "#ec4899",
    },
    "Bottom Sector": {
      x: 28, y: 80, w: 44, h: 18,
      exits: [],
      color: "#22c55e",
    },
  },
};

function getRiskColor(riskScore) {
  if (riskScore > 75) return { fill: 'rgba(239,68,68,0.45)',  stroke: '#ef4444', text: '#fca5a5' };
  if (riskScore > 45) return { fill: 'rgba(249,115,22,0.30)', stroke: '#f97316', text: '#fdba74' };
  if (riskScore > 15) return { fill: 'rgba(250,204,21,0.20)', stroke: '#facc15', text: '#fde68a' };
  return { fill: 'rgba(34,197,94,0.12)', stroke: '#22c55e', text: '#86efac' };
}

function ExitMarker({ exit: ex, zone }) {
  const styles = { top: {}, bottom: {}, left: {}, right: {} };
  let x, y, rotate = 0;
  if (ex.side === 'top')    { x = zone.x + zone.w * ex.offset / 100; y = zone.y;           rotate = 180; }
  if (ex.side === 'bottom') { x = zone.x + zone.w * ex.offset / 100; y = zone.y + zone.h;  rotate = 0; }
  if (ex.side === 'left')   { x = zone.x;           y = zone.y + zone.h * ex.offset / 100; rotate = 90; }
  if (ex.side === 'right')  { x = zone.x + zone.w;  y = zone.y + zone.h * ex.offset / 100; rotate = 270; }

  return (
    <g>
      {/* Green exit box */}
      <rect x={`${x - 4}%`} y={`${y - 2.5}%`} width="8%" height="5%" rx="2"
        fill="#065f46" stroke="#22c55e" strokeWidth="0.4" />
      {/* Arrow */}
      <text x={`${x}%`} y={`${y + 0.2}%`} textAnchor="middle" dominantBaseline="middle"
        fill="#22c55e" fontSize="2.2%" fontWeight="bold"
        transform={`rotate(${rotate}, ${x}%, ${y}%)`}>↑</text>
      {/* Label */}
      <text x={`${x}%`} y={`${y + (ex.side === 'top' || ex.side === 'bottom' ? -3.5 : 0)}%`}
        textAnchor="middle" dominantBaseline="middle"
        fill="#4ade80" fontSize="1.8%" fontFamily="monospace" fontWeight="bold">
        {ex.label}
      </text>
    </g>
  );
}

export default function DensityHeatmap({ data }) {
  const zones = data.zones || {};
  const alerts = data.alerts || [];
  // Evacuation routing has been removed as the platform is structurally agnostic

  return (
    <div style={{ height: '100%', display: 'flex', gap: 20 }}>

      {/* ── FLOOR PLAN ── */}
      <div style={{ flex: 1, background: '#0b0f19', border: '1px solid #1f2937', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Live Grid — {VENUE.name}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Real-time crowd density heatmap · Fruin Level of Service</div>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            {[['SAFE', '#22c55e'], ['WARNING', '#f97316'], ['CRITICAL', '#ef4444']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                <span style={{ color: '#9ca3af' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block' }}>

            {/* Background grid */}
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.3"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* Outer building boundary */}
            <rect x="1" y="1" width="98" height="98" rx="2"
              fill="none" stroke="#374151" strokeWidth="0.6" strokeDasharray="2,1" />

            {/* Flow connections removed */}

            {/* Zone boxes */}
            {Object.entries(VENUE.zones).map(([name, zone]) => {
              const info = zones[name] || { risk_score: 0, density: 0, count: 0, status: 'SAFE' };
              const { fill, stroke, text } = getRiskColor(info.risk_score);
              const pulse = info.risk_score > 75;

              return (
                <g key={name}>
                  {/* Glow effect for critical zones */}
                  {pulse && (
                    <rect x={`${zone.x - 0.5}%`} y={`${zone.y - 0.5}%`}
                      width={`${zone.w + 1}%`} height={`${zone.h + 1}%`} rx="1.5"
                      fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.5">
                      <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite"/>
                    </rect>
                  )}

                  {/* Zone fill */}
                  <rect x={`${zone.x}%`} y={`${zone.y}%`} width={`${zone.w}%`} height={`${zone.h}%`} rx="1"
                    fill={fill} stroke={stroke} strokeWidth="0.5" />

                  {/* Zone name */}
                  <text x={`${zone.x + zone.w / 2}%`} y={`${zone.y + zone.h / 2 - 5}%`}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={text} fontSize="2.8" fontWeight="700" fontFamily="sans-serif">
                    {name}
                  </text>

                  {/* Count */}
                  <text x={`${zone.x + zone.w / 2}%`} y={`${zone.y + zone.h / 2 - 0.5}%`}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#fff" fontSize="5" fontWeight="800" fontFamily="monospace">
                    {info.count || 0}
                  </text>
                  <text x={`${zone.x + zone.w / 2}%`} y={`${zone.y + zone.h / 2 + 4.5}%`}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={text} fontSize="2" fontFamily="monospace">
                    {info.density} p/m² · {Math.round(info.risk_score)}%
                  </text>

                  {/* Status badge */}
                  <rect x={`${zone.x + zone.w / 2 - 6}%`} y={`${zone.y + zone.h / 2 + 7}%`}
                    width="12%" height="3.5%" rx="1" fill={stroke} opacity="0.25" />
                  <text x={`${zone.x + zone.w / 2}%`} y={`${zone.y + zone.h / 2 + 8.8}%`}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={text} fontSize="1.8" fontWeight="700" fontFamily="monospace">
                    {info.status || 'SAFE'}
                  </text>

                  {/* Exit markers */}
                  {zone.exits.map((ex, i) => (
                    <ExitMarker key={i} exit={ex} zone={zone} />
                  ))}
                </g>
              );
            })}

            {/* Legend: compass */}
            <text x="96%" y="4%" textAnchor="middle" fill="#4b5563" fontSize="3" fontWeight="bold">N</text>
            <line x1="96%" y1="5%" x2="96%" y2="8%" stroke="#4b5563" strokeWidth="0.4" />
          </svg>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Alert summary */}
        <div style={{
          padding: 16, borderRadius: 12,
          background: alerts.length > 0 ? 'rgba(127,29,29,0.4)' : '#1a2235',
          border: `1px solid ${alerts.length > 0 ? '#7f1d1d' : '#1f2937'}`,
          boxShadow: alerts.length > 0 ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={20} color={alerts.length > 0 ? '#f87171' : '#4b5563'} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: alerts.length > 0 ? '#f87171' : '#6b7280' }}>
                {alerts.length} Alert{alerts.length !== 1 ? 's' : ''} Active
              </div>
              <div style={{ fontSize: 11, color: '#4b5563' }}>Real-time crowd monitoring</div>
            </div>
          </div>
        </div>

        {/* Active alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.length === 0 ? (
            <div style={{ background: '#1a2235', borderRadius: 10, border: '1px solid #1f2937', padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} color="#22c55e" />
              <span style={{ fontSize: 13, color: '#6b7280' }}>All zones nominal</span>
            </div>
          ) : alerts.map((alert, i) => (
            <div key={i} style={{ background: 'rgba(127,29,29,0.3)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1.5 }}>{alert.type}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{alert.zone}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
                <span style={{ color: '#6b7280' }}>Risk</span><span style={{ color: '#f87171', fontWeight: 700 }}>{Math.round(alert.risk)}%</span>
                <span style={{ color: '#6b7280' }}>Density</span><span style={{ color: '#fb923c', fontWeight: 700 }}>{alert.density} p/m²</span>
                <span style={{ color: '#6b7280' }}>LoS</span><span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: 10 }}>{alert.los}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Evacuation routes removed */}
      </div>
    </div>
  );
}
