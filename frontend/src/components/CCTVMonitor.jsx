import React from 'react';
import { Users, RefreshCw, Activity, Wind, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

const LEVEL = {
  'HIGH RISK': { bg: 'rgba(127,29,29,0.55)',  border: '#ef4444', text: '#f87171', badge: '#ef4444', glow: '0 0 20px rgba(239,68,68,0.5)' },
  'WARNING':   { bg: 'rgba(120,53,15,0.45)',  border: '#f97316', text: '#fb923c', badge: '#f97316', glow: '0 0 14px rgba(249,115,22,0.35)' },
  'NORMAL':    { bg: 'rgba(6,78,59,0.18)',    border: '#22c55e', text: '#4ade80', badge: '#22c55e', glow: 'none' },
};

const levelColor = l => l === 'HIGH RISK' ? '#ef4444' : l === 'WARNING' ? '#f97316' : '#22c55e';
const levelIcon  = l => l === 'HIGH RISK' ? '🚨' : l === 'WARNING' ? '⚠️' : '✓';

export default function CCTVMonitor({ data }) {
  const boxes     = data.boxes || [];
  const frame     = data.frame || null;
  const yoloCnt   = data.yolo_count || 0;
  const dmapCnt   = data.density_map_count || 0;
  const totalCnt  = data.total_count || 0;

  const zones       = data.zones || {};
  const sortedZones = Object.entries(zones).sort((a,b) => b[1].risk_score - a[1].risk_score);
  const [peakName, peakData] = sortedZones[0] || ['—', { risk_score:0, status:'NORMAL', los:'A/B — Free Flow' }];

  const rois = data.rois || {
    "Top Sector":       [0.25, 0.00, 0.75, 0.25],
    "Bottom Sector":    [0.25, 0.75, 0.75, 1.00],
    "Left Sector":      [0.00, 0.00, 0.25, 1.00],
    "Right Sector":     [0.75, 0.00, 1.00, 1.00],
    "Center Sector":    [0.25, 0.25, 0.75, 0.75],
  };

  const BOUNDARIES = [
    { label:'TOP SECTOR',    key:'Top Sector',       left: rois['Top Sector'][0]*100,    top: rois['Top Sector'][1]*100,    w: (rois['Top Sector'][2]-rois['Top Sector'][0])*100,       h: (rois['Top Sector'][3]-rois['Top Sector'][1])*100 },
    { label:'BOTTOM SECTOR', key:'Bottom Sector',    left: rois['Bottom Sector'][0]*100, top: rois['Bottom Sector'][1]*100, w: (rois['Bottom Sector'][2]-rois['Bottom Sector'][0])*100, h: (rois['Bottom Sector'][3]-rois['Bottom Sector'][1])*100 },
    { label:'LEFT SECTOR',   key:'Left Sector',      left: rois['Left Sector'][0]*100,   top: rois['Left Sector'][1]*100,   w: (rois['Left Sector'][2]-rois['Left Sector'][0])*100,     h: (rois['Left Sector'][3]-rois['Left Sector'][1])*100 },
    { label:'RIGHT SECTOR',  key:'Right Sector',     left: rois['Right Sector'][0]*100,  top: rois['Right Sector'][1]*100,  w: (rois['Right Sector'][2]-rois['Right Sector'][0])*100,   h: (rois['Right Sector'][3]-rois['Right Sector'][1])*100 },
    { label:'CENTER SECTOR', key:'Center Sector',    left: rois['Center Sector'][0]*100, top: rois['Center Sector'][1]*100, w: (rois['Center Sector'][2]-rois['Center Sector'][0])*100, h: (rois['Center Sector'][3]-rois['Center Sector'][1])*100 },
  ];

  const handleReplay = () => fetch('http://localhost:8000/api/replay', { method:'POST' });
  const handleSwitch = (filename) => fetch('http://localhost:8000/api/switch_camera', { method:'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename }) });

  return (
    <div style={{ display:'flex', height:'100%', gap:20 }}>

      {/* ── VIDEO FEED ── */}
      <div style={{ flex:1, background:'#000', borderRadius:12, border:'1px solid #1f2937', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* HUD - Moved Above Video */}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'15px 15px 0 15px', zIndex:10 }}>
          <div style={{ display:'flex', gap:10 }}>
            {/* REC */}
            <div style={{ background:'rgba(0,0,0,0.82)', border:'1px solid #374151', borderRadius:6, padding:'4px 10px', fontSize:11, fontFamily:'monospace', display:'flex', alignItems:'center', gap:6, color:'#d1d5db' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444', animation:'pulse 1s infinite' }} />
              LIVE · AI-ENHANCED
            </div>

            {/* Model badges */}
            <div style={{ background:'rgba(59, 130, 246, 0.1)', border:'1px solid rgba(59, 130, 246, 0.3)', borderRadius:6, padding:'4px 10px', fontSize:11, fontFamily:'monospace', display:'flex', alignItems:'center', gap:6, color:'#60a5fa' }}>
              <Cpu size={14} /> YOLOv8 · {yoloCnt}
            </div>
            <div style={{ background:'rgba(168, 85, 247, 0.1)', border:'1px solid rgba(168, 85, 247, 0.3)', borderRadius:6, padding:'4px 10px', fontSize:11, fontFamily:'monospace', display:'flex', alignItems:'center', gap:6, color:'#c084fc' }}>
              <Activity size={14} /> Density · {dmapCnt}
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => handleSwitch('overhead_crowd.mp4')} style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:6, padding:'4px 12px', fontSize:11, fontFamily:'monospace', color:'#f59e0b', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
              CAM 1
            </button>
            <button onClick={() => handleSwitch('topview_dataset.mp4')} style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, padding:'4px 12px', fontSize:11, fontFamily:'monospace', color:'#10b981', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
              CAM 2
            </button>
            <button onClick={() => handleSwitch('pexels_market.mp4')} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'4px 12px', fontSize:11, fontFamily:'monospace', color:'#ef4444', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
              CAM 3
            </button>
            <button onClick={handleReplay} style={{ background:'rgba(0,0,0,0.8)', border:'1px solid #374151', borderRadius:6, padding:'4px 12px', fontSize:11, fontFamily:'monospace', color:'#d1d5db', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
              <RefreshCw size={12}/> REPLAY
            </button>
          </div>
        </div>

        {/* Video + overlays */}
        <div style={{ flex:1, position:'relative', margin:15 }}>
          {frame
            ? <img src={frame} alt="live feed" style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }}/>
            : <div style={{ width:'100%', height:'100%', background:'#0b0f19', display:'flex', alignItems:'center', justifyContent:'center', color:'#374151', fontSize:13 }}>
                Connecting to stream…
              </div>
          }

          {/* Analytical Grid System */}
          {frame && (
            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', display:'grid', gridTemplateColumns:'repeat(16, 1fr)', gridTemplateRows:'repeat(12, 1fr)', pointerEvents:'none' }}>
              {(() => {
                const GRID_COLS = 16;
                const GRID_ROWS = 12;
                const grid = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));
                (boxes || []).forEach(b => {
                  const cx = b.x + b.w / 2;
                  const cy = b.y + b.h / 2;
                  const c = Math.floor((cx / 100) * GRID_COLS);
                  const r = Math.floor((cy / 100) * GRID_ROWS);
                  if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) grid[r][c]++;
                });
                return grid.flatMap((row, r) => row.map((count, c) => {
                  if (count === 0) return <div key={`${r}-${c}`} style={{ border:'1px solid rgba(255,255,255,0.02)' }}/>;
                  const isHigh = count >= 3;
                  const isMed = count === 2;
                  const color = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#3b82f6';
                  const bg = isHigh ? 'rgba(239,68,68,0.25)' : isMed ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.1)';
                  return (
                    <div key={`${r}-${c}`} style={{ border:`1px solid ${color}40`, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ color:'#fff', fontSize:9, fontWeight:800, background:'rgba(0,0,0,0.7)', padding:'1px 4px', borderRadius:4, fontFamily:'monospace' }}>{count}</span>
                    </div>
                  );
                }));
              })()}
            </div>
          )}

          {/* Zone boundary overlays */}
          {frame && BOUNDARIES.map(z => {
            const zd    = zones[z.key] || {};
            const level = zd.status || 'NORMAL';
            const st    = LEVEL[level] || LEVEL.NORMAL;
            const isHigh= level === 'HIGH RISK';
            const isWarn= level === 'WARNING';
            return (
              <div key={z.key} style={{
                position:'absolute',
                left:`${z.left}%`, top:`${z.top}%`,
                width:`${z.w}%`, height:`${z.h}%`,
                border:`1.5px solid ${st.border}`,
                background: st.bg,
                boxSizing:'border-box',
                boxShadow: isHigh ? `inset 0 0 24px rgba(239,68,68,0.22), ${st.glow}` : 'none',
                animation: isHigh ? 'none' : 'none',
                transition: 'all 0.4s',
              }}>
                {/* Zone name chip */}
                <div style={{
                  position:'absolute', top:4, left:4,
                  background:'rgba(0,0,0,0.88)', borderRadius:5,
                  padding:'3px 7px', fontSize:9, fontWeight:700,
                  fontFamily:'monospace', color:st.text,
                  border:`1px solid ${st.border}33`,
                  display:'flex', alignItems:'center', gap:4,
                }}>
                  {isHigh && <div style={{ width:5, height:5, borderRadius:'50%', background:'#ef4444', animation:'pulse 0.7s infinite' }}/>}
                  {z.label}
                </div>

                {/* Risk level badge */}
                {level !== 'NORMAL' && (
                  <div style={{
                    position:'absolute', top:4, right:4,
                    background:st.badge+'22', border:`1px solid ${st.badge}`,
                    borderRadius:4, padding:'2px 7px',
                    fontSize:8, fontWeight:800, color:st.text,
                    fontFamily:'monospace', letterSpacing:1,
                  }}>
                    {levelIcon(level)} {level}
                  </div>
                )}

                {/* Count + risk */}
                <div style={{
                  position:'absolute', bottom:4, left:4,
                  background:'rgba(0,0,0,0.88)', borderRadius:5,
                  padding:'3px 7px', fontSize:10, fontFamily:'monospace',
                  color:'#d1d5db', display:'flex', alignItems:'center', gap:6,
                }}>
                  <span>{zd.count||0}p</span>
                  <span style={{ color:st.text, fontWeight:700 }}>{zd.risk_score||0}%</span>
                  {(zd.pressure||0) > 0.3 && <span style={{ color:'#fb923c', fontSize:9 }}>▲</span>}
                </div>
              </div>
            );
          })}

          {/* Bottom count pill */}
          <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.82)', border:'1px solid #374151', borderRadius:6, padding:'4px 10px', fontSize:11, fontFamily:'monospace', color:'#9ca3af', display:'flex', alignItems:'center', gap:6 }}>
            <Users size={11}/> {totalCnt} detected
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ width:265, display:'flex', flexDirection:'column', gap:12 }}>

        {/* Peak risk card */}
        {(() => {
          const st  = LEVEL[peakData.status] || LEVEL.NORMAL;
          const col = levelColor(peakData.status);
          return (
            <div style={{ padding:16, borderRadius:12, background:st.bg, border:`1px solid ${col}`, boxShadow:st.glow }}>
              <div style={{ fontSize:10, color:'#6b7280', fontWeight:600, letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>Peak Risk Zone</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:4 }}>{peakName}</div>
              <div style={{ fontSize:48, fontWeight:800, color:col, lineHeight:1, marginBottom:8 }}>{peakData.risk_score||0}%</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:4, fontSize:10, fontWeight:800, letterSpacing:2, fontFamily:'monospace', background:col+'18', color:col, border:`1px solid ${col}` }}>
                {levelIcon(peakData.status)} {peakData.status||'NORMAL'}
              </div>
              <div style={{ marginTop:8, fontSize:10, color:'#6b7280' }}>{peakData.los||'A/B — Free Flow'}</div>
            </div>
          );
        })()}

        {/* How alerts escalate */}
        <div style={{ background:'#0c1220', border:'1px solid #1f2937', borderRadius:10, padding:14 }}>
          <div style={{ fontSize:10, color:'#4b5563', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>Alert Escalation</div>
          {[
            ['NORMAL',    '#22c55e', '< 38% risk',             '✓  Free flowing'],
            ['WARNING',   '#f97316', '≥ 38% for 8 frames',     '⚠  Monitor closely'],
            ['HIGH RISK', '#ef4444', '≥ 62% for 20 frames',    '🚨 Evacuate now'],
          ].map(([lvl, col, trig, desc]) => (
            <div key={lvl} style={{ display:'flex', gap:10, marginBottom:9, alignItems:'flex-start' }}>
              <div style={{ width:9, height:9, borderRadius:2, background:col, marginTop:2, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:col }}>{lvl}</div>
                <div style={{ fontSize:9, color:'#4b5563', marginTop:1 }}>{trig}</div>
                <div style={{ fontSize:9, color:'#6b7280' }}>{desc}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid #1f2937', fontSize:9, color:'#4b5563', lineHeight:1.5 }}>
            Temporal smoothing α=0.28 · Clears after 12 safe frames
          </div>
        </div>

        {/* Live zone breakdown */}
        <div style={{ background:'#0c1220', border:'1px solid #1f2937', borderRadius:10, padding:14, flex:1, overflowY:'auto' }}>
          <div style={{ fontSize:10, color:'#4b5563', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>Zone Breakdown</div>
          {sortedZones.map(([name, zd]) => {
            const col = levelColor(zd.status);
            const pct = Math.min(100, zd.risk_score||0);
            return (
              <div key={name} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#e5e7eb' }}>{name}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:'monospace' }}>
                    {zd.count||0}p · {pct}%
                  </span>
                </div>
                <div style={{ height:4, background:'#1f2937', borderRadius:2, overflow:'hidden', marginBottom:4 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:col, borderRadius:2, transition:'width 0.5s' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:9, color:'#6b7280' }}>{zd.los||'A/B — Free Flow'}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:col }}>{zd.status||'NORMAL'}</span>
                </div>
                {(zd.pressure||0) > 0.25 && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, fontSize:9, color:'#f97316' }}>
                    <Wind size={8}/> pressure {((zd.pressure||0)*100).toFixed(0)}%
                    {zd.divergence > 0.1 && <span style={{ color:'#facc15', marginLeft:4 }}>↑ building</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
