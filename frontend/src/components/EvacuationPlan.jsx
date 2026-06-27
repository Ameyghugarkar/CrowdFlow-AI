import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, Signpost, Users } from 'lucide-react';

export default function EvacuationPlan({ data }) {
  const zones = data?.zones || {};

  const isBlocked = (zoneName) => zones[zoneName]?.status === 'HIGH RISK';

  const topBlocked    = isBlocked('Top Sector');
  const bottomBlocked = isBlocked('Bottom Sector');
  const leftBlocked   = isBlocked('Left Sector');
  const rightBlocked  = isBlocked('Right Sector');
  const centerBlocked = isBlocked('Center Sector');

  const instructions = useMemo(() => {
    let steps = [];
    if (centerBlocked) steps.push("CRITICAL: Center intersection is heavily congested. Redirect all crowds immediately to the perimeter.");
    if (bottomBlocked) steps.push("WARNING: South Exit (Bottom Sector) is BLOCKED by a crowd crush. Do not route people South.");
    else steps.push("South Exit is CLEAR. Direct internal crowds towards the South gates.");
    if (topBlocked) steps.push("WARNING: North Exit (Top Sector) is BLOCKED. Seal doors and route crowds East/West.");
    else steps.push("North Exit is CLEAR. Evacuate safely through North corridors.");
    if (!leftBlocked && !rightBlocked) steps.push("Lateral Exits (East/West) are operating at safe capacity. Primary evacuation routes.");
    else if (leftBlocked) steps.push("West Exit is over capacity. Reroute foot traffic to the East.");
    return steps;
  }, [topBlocked, bottomBlocked, leftBlocked, rightBlocked, centerBlocked]);

  // SVG coordinate system: 540x540 viewBox with a clean 3x3 grid
  // Grid cells: each cell is 180x180
  // Top Sector:    col1 (180..360),  row0 (0..180)
  // Left Sector:   col0 (0..180),    row1 (180..360)
  // Center Sector: col1 (180..360),  row1 (180..360)
  // Right Sector:  col2 (360..540),  row1 (180..360)
  // Bottom Sector: col1 (180..360),  row2 (360..540)

  const C = 180; // cell size
  const PAD = 10; // padding inside cells for sector boxes

  const SectorBox = ({ col, row, name, blocked }) => {
    const x = col * C + PAD;
    const y = row * C + PAD;
    const w = C - PAD * 2;
    const h = C - PAD * 2;
    const cx = x + w / 2;
    const cy = y + h / 2;
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx="10"
          fill={blocked ? 'rgba(239,68,68,0.18)' : 'rgba(31,41,55,0.7)'}
          stroke={blocked ? '#ef4444' : '#374151'}
          strokeWidth="2" />
        <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="middle"
          fill={blocked ? '#fca5a5' : '#9ca3af'}
          fontSize="13" fontWeight="700" letterSpacing="1.5">
          {name.split(' ')[0].toUpperCase()}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle"
          fill={blocked ? '#fca5a5' : '#6b7280'}
          fontSize="11" fontWeight="500">
          SECTOR
        </text>
        {blocked && (
          <>
            <circle cx={cx} cy={cy + 32} r="5" fill="#ef4444">
              <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </g>
    );
  };

  // Arrow from center of one cell toward edge pointing outward
  // direction: N, S, E, W
  // Arrow fills the gap between the center box and the outer sector box
  const Arrow = ({ dir, blocked }) => {
    const color = blocked ? '#ef4444' : '#10b981';
    const opacity = blocked ? 0.7 : 0.9;

    // Arrow in the gap corridor between center (col1,row1) and the neighbouring sector
    // Each arrow sits in the corridor (gap between sectors is just the border)
    // We draw arrows as polylines pointing outward from center sector edges

    let points = '';
    let labelX = 0, labelY = 0;

    // Arrow shaft + head as polygon
    // Arrow goes from center-sector edge outward toward neighboring sector center
    if (dir === 'N') {
      // Gap: x=180..360, y=0..180 (Top cell). Arrow points up.
      // shaft from y=172 up to y=18, centered at x=270
      points = `255,165 285,165 285,30 310,30 270,5 230,30 255,30`;
      labelX = 270; labelY = 185;
    } else if (dir === 'S') {
      // shaft from y=368 down to y=522, centered at x=270
      points = `255,375 285,375 285,510 310,510 270,535 230,510 255,510`;
      labelX = 270; labelY = 355;
    } else if (dir === 'W') {
      // shaft from x=172 left to x=18, centered at y=270
      points = `165,255 165,285 30,285 30,310 5,270 30,230 30,255`;
      labelX = 185; labelY = 270;
    } else if (dir === 'E') {
      // shaft from x=368 right to x=522, centered at y=270
      points = `375,255 375,285 510,285 510,310 535,270 510,230 510,255`;
      labelX = 355; labelY = 270;
    }

    return (
      <g opacity={opacity}>
        <polygon points={points} fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" />
        {blocked && (() => {
          // Draw X over the arrow
          let x1, y1, x2, y2, x3, y3, x4, y4;
          if (dir === 'N') { x1=250;y1=50;x2=290;y2=140; x3=290;y3=50;x4=250;y4=140; }
          else if (dir === 'S') { x1=250;y1=400;x2=290;y2=490; x3=290;y3=400;x4=250;y4=490; }
          else if (dir === 'W') { x1=40;y1=250;x2=140;y2=290; x3=40;y3=290;x4=140;y4=250; }
          else { x1=400;y1=250;x2=500;y2=290; x3=400;y3=290;x4=500;y4=250; }
          return (
            <>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="8" strokeLinecap="round" />
              <line x1={x3} y1={y3} x2={x4} y2={y4} stroke="white" strokeWidth="8" strokeLinecap="round" />
            </>
          );
        })()}
      </g>
    );
  };

  const anyHighRisk = Object.values(zones).some(z => z.status === 'HIGH RISK');

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%', minHeight: 0 }}>

      {/* Visual Map Panel */}
      <div style={{
        flex: 1, background: '#131b2c', border: '1px solid #1f2937',
        borderRadius: 16, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', minHeight: 0
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #1f2937',
          background: '#1a2235', display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0
        }}>
          <Signpost color="#60a5fa" size={22} />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', letterSpacing: 0.5 }}>
            Live Evacuation Routing (CAM 3)
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#3b82f6',
              boxShadow: '0 0 8px #3b82f6',
              animation: 'ping 1s ease-in-out infinite'
            }} />
            <span style={{ fontSize: 11, color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              AI Routing Active
            </span>
          </div>
        </div>

        {/* SVG Map - fills remaining space */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, minHeight: 0
        }}>
          <svg viewBox="0 0 540 540" style={{ width: '100%', height: '100%', maxHeight: '100%', maxWidth: '100%' }}>
            {/* Background grid dots */}
            <defs>
              <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.04)" />
              </pattern>
            </defs>
            <rect width="540" height="540" fill="url(#dots)" />

            {/* Arrows FIRST (behind sectors) */}
            <Arrow dir="N" blocked={topBlocked} />
            <Arrow dir="S" blocked={bottomBlocked} />
            <Arrow dir="W" blocked={leftBlocked} />
            <Arrow dir="E" blocked={rightBlocked} />

            {/* Sector Boxes ON TOP */}
            <SectorBox col={1} row={0} name="Top"    blocked={topBlocked} />
            <SectorBox col={0} row={1} name="Left"   blocked={leftBlocked} />
            <SectorBox col={1} row={1} name="Center" blocked={centerBlocked} />
            <SectorBox col={2} row={1} name="Right"  blocked={rightBlocked} />
            <SectorBox col={1} row={2} name="Bottom" blocked={bottomBlocked} />

            {/* Directional EXIT sign badges */}
            {/* NORTH */}
            <g>
              <rect x={220} y={2} width={100} height={26} rx="6"
                fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
              <text x={270} y={16} textAnchor="middle" dominantBaseline="middle"
                fill="#e2e8f0" fontSize="12" fontWeight="800" letterSpacing="2">
                ↑ NORTH
              </text>
            </g>
            {/* SOUTH */}
            <g>
              <rect x={220} y={512} width={100} height={26} rx="6"
                fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
              <text x={270} y={526} textAnchor="middle" dominantBaseline="middle"
                fill="#e2e8f0" fontSize="12" fontWeight="800" letterSpacing="2">
                ↓ SOUTH
              </text>
            </g>
            {/* WEST */}
            <g>
              <rect x={2} y={250} width={80} height={26} rx="6"
                fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
              <text x={42} y={264} textAnchor="middle" dominantBaseline="middle"
                fill="#e2e8f0" fontSize="12" fontWeight="800" letterSpacing="2">
                ← WEST
              </text>
            </g>
            {/* EAST */}
            <g>
              <rect x={458} y={250} width={80} height={26} rx="6"
                fill="rgba(15,23,42,0.85)" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
              <text x={498} y={264} textAnchor="middle" dominantBaseline="middle"
                fill="#e2e8f0" fontSize="12" fontWeight="800" letterSpacing="2">
                EAST →
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Instructions Panel */}
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>

        {/* Status Card */}
        <div style={{
          background: '#1a2235', border: '1px solid #1f2937', borderRadius: 14,
          padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', flexShrink: 0
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
            System Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              padding: 12, borderRadius: 10,
              background: anyHighRisk ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: anyHighRisk ? '#ef4444' : '#10b981'
            }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
                {anyHighRisk ? 'Evacuation Required' : 'Safe Capacity'}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Real-time geometric routing</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          background: '#1a2235', border: '1px solid #1f2937', borderRadius: 14,
          padding: '14px 20px', flexShrink: 0
        }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 10, background: '#10b981', borderRadius: 3 }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Clear Route</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 10, background: '#ef4444', borderRadius: 3 }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Blocked / HIGH RISK</span>
            </div>
          </div>
        </div>

        {/* Tactical Directives */}
        <div style={{
          flex: 1, background: '#1a2235', border: '1px solid #1f2937', borderRadius: 14,
          padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', overflowY: 'auto', minHeight: 0
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={13} /> Tactical Directives
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {instructions.map((inst, i) => {
              const isWarn = inst.includes('WARNING') || inst.includes('CRITICAL');
              return (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: isWarn ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                  border: `1px solid ${isWarn ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                  display: 'flex', gap: 12, alignItems: 'flex-start'
                }}>
                  <div style={{ color: isWarn ? '#ef4444' : '#10b981', marginTop: 1, flexShrink: 0 }}>
                    {isWarn ? <AlertTriangle size={16} /> : <ArrowRight size={16} />}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: isWarn ? '#fca5a5' : '#a7f3d0' }}>
                    {inst}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
