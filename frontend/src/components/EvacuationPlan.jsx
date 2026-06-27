import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, ShieldCheck, Signpost, Users } from 'lucide-react';

export default function EvacuationPlan({ data }) {
  const zones = data?.zones || {};

  // Determine which exits are blocked based on zone risk
  const isBlocked = (zoneName) => {
    return zones[zoneName]?.status === 'HIGH RISK';
  };

  const topBlocked    = isBlocked('Top Sector');
  const bottomBlocked = isBlocked('Bottom Sector');
  const leftBlocked   = isBlocked('Left Sector');
  const rightBlocked  = isBlocked('Right Sector');
  const centerBlocked = isBlocked('Center Sector');

  // Dynamic Instructions based on blocked paths
  const instructions = useMemo(() => {
    let steps = [];
    if (centerBlocked) {
      steps.push("CRITICAL: Center intersection is heavily congested. Redirect all crowds immediately to the perimeter.");
    }
    
    if (bottomBlocked) {
      steps.push("WARNING: South Exit (Bottom Sector) is BLOCKED by a crowd crush. Do not route people South.");
    } else {
      steps.push("South Exit is CLEAR. Direct internal crowds towards the South gates.");
    }

    if (topBlocked) {
      steps.push("WARNING: North Exit (Top Sector) is BLOCKED. Seal doors and route crowds East/West.");
    } else {
      steps.push("North Exit is CLEAR. Evacuate safely through North corridors.");
    }

    if (!leftBlocked && !rightBlocked) {
      steps.push("Lateral Exits (East/West) are operating at safe capacity. Primary evacuation routes.");
    } else if (leftBlocked) {
      steps.push("West Exit is over capacity. Reroute foot traffic to the East.");
    }

    return steps;
  }, [topBlocked, bottomBlocked, leftBlocked, rightBlocked, centerBlocked]);

  const ArrowPath = ({ blocked, direction, x, y, rotation }) => {
    const color = blocked ? '#ef4444' : '#10b981';
    return (
      <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        <path d="M 0,-15 L 40,-15 L 40,-30 L 70,0 L 40,30 L 40,15 L 0,15 Z" 
              fill={color} 
              opacity={blocked ? 0.3 : 0.8}
              stroke={blocked ? '#991b1b' : '#059669'} 
              strokeWidth="2" />
        {blocked && (
          <g transform="translate(35, 0)">
            <line x1="-15" y1="-15" x2="15" y2="15" stroke="#fff" strokeWidth="6" />
            <line x1="-15" y1="15" x2="15" y2="-15" stroke="#fff" strokeWidth="6" />
          </g>
        )}
      </g>
    );
  };

  const SectorBox = ({ name, blocked, x, y, w, h }) => (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={w} height={h} rx="8" 
            fill={blocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(31, 41, 55, 0.5)'}
            stroke={blocked ? '#ef4444' : '#374151'}
            strokeWidth="2" />
      <text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="middle" 
            fill={blocked ? '#fca5a5' : '#9ca3af'}
            fontSize="14" fontWeight="600" letterSpacing="1">
        {name.toUpperCase()}
      </text>
      {blocked && (
        <circle cx={w/2} cy={h/2 + 25} r="6" fill="#ef4444" className="animate-pulse" />
      )}
    </g>
  );

  return (
    <div className="flex gap-6 h-full">
      
      {/* Visual Map Area */}
      <div className="flex-1 bg-[#131b2c] border border-gray-800 rounded-xl flex flex-col overflow-hidden relative shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-[#1a2235] flex items-center gap-3">
          <Signpost className="text-blue-400" size={24} />
          <h2 className="font-bold text-lg text-gray-100 tracking-wide">Live Evacuation Routing (CAM 3)</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-xs text-blue-400 font-mono font-semibold uppercase tracking-wider">AI Routing Active</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <svg width="600" height="600" viewBox="0 0 600 600" className="drop-shadow-2xl">
            
            {/* Background Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Sectors */}
            {/* Center Sector is 200x200 in the middle */}
            <SectorBox name="Top Sector" blocked={topBlocked} x={200} y={50} w={200} h={120} />
            <SectorBox name="Bottom Sector" blocked={bottomBlocked} x={200} y={430} w={200} h={120} />
            <SectorBox name="Left Sector" blocked={leftBlocked} x={50} y={200} w={120} h={200} />
            <SectorBox name="Right Sector" blocked={rightBlocked} x={430} y={200} w={120} h={200} />
            <SectorBox name="Center Sector" blocked={centerBlocked} x={200} y={200} w={200} h={200} />

            {/* Dynamic Routing Arrows originating from Center outwards */}
            <ArrowPath blocked={rightBlocked} direction="East" x={350} y={300} rotation={0} />
            <ArrowPath blocked={bottomBlocked} direction="South" x={300} y={350} rotation={90} />
            <ArrowPath blocked={leftBlocked} direction="West" x={250} y={300} rotation={180} />
            <ArrowPath blocked={topBlocked} direction="North" x={300} y={250} rotation={270} />

          </svg>
        </div>
      </div>

      {/* Instructions Panel */}
      <div className="w-[380px] flex flex-col gap-4">
        
        {/* Status Card */}
        <div className="bg-[#1a2235] border border-gray-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">System Status</h3>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${Object.values(zones).some(z => z.status === 'HIGH RISK') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">
                {Object.values(zones).some(z => z.status === 'HIGH RISK') ? 'Evacuation Required' : 'Safe Capacity'}
              </div>
              <div className="text-sm text-gray-400 mt-1">Real-time geometric routing</div>
            </div>
          </div>
        </div>

        {/* Actionable Steps */}
        <div className="flex-1 bg-[#1a2235] border border-gray-800 rounded-xl p-5 shadow-lg overflow-y-auto">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
            <Users size={14} /> Tactical Directives
          </h3>
          <div className="flex flex-col gap-4">
            {instructions.map((inst, i) => {
              const isWarning = inst.includes("WARNING") || inst.includes("CRITICAL");
              return (
                <div key={i} className={`p-4 rounded-lg border ${isWarning ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'} flex gap-3 items-start`}>
                  <div className={`mt-0.5 ${isWarning ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isWarning ? <AlertTriangle size={18} /> : <ArrowRight size={18} />}
                  </div>
                  <div className={`text-sm leading-relaxed ${isWarning ? 'text-red-200' : 'text-emerald-100'}`}>
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
