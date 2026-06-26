import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function EmergencyAlertCenter({ data }) {
  const alerts = data.alerts || [];

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] p-5 text-gray-200" style={{ fontFamily:'Inter, sans-serif' }}>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-100 m-0">Live Risk Feed</h2>
          <p className="text-xs text-gray-400 m-0">AI-detected anomalies & density surges</p>
        </div>
        <div className="ml-auto">
          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
            {alerts.length} ACTIVE
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3 border border-dashed border-gray-700/50 rounded-xl bg-[#060b14]/50">
            <CheckCircle size={32} className="opacity-20" />
            <p className="text-sm font-medium">No critical risks detected.</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className={`p-4 rounded-xl border relative overflow-hidden bg-[#060b14] ${alert.level === 'HIGH RISK' ? 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]'}`}>
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div>
                  <h3 className={`text-sm font-bold m-0 flex items-center gap-2 ${alert.level === 'HIGH RISK' ? 'text-red-400' : 'text-orange-400'}`}>
                    {alert.level === 'HIGH RISK' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                    {alert.type}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">{alert.zone.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black tracking-tight ${alert.level === 'HIGH RISK' ? 'text-red-500' : 'text-orange-500'}`}>
                    {alert.risk.toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Severity Score</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
