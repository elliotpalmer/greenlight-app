import React, { useState } from 'react';
import { calculateBreak } from '../services/physics';
import { AppSettings } from '../types';

interface BreakTableProps {
  stimp: number;
  settings: AppSettings;
}

const BreakTable: React.FC<BreakTableProps> = ({ stimp, settings }) => {
  const [showRules, setShowRules] = useState(false);
  const distances = [3, 5, 7, 10, 12, 15, 18, 20, 25, 30, 35, 40, 50, 60];
  const slopes = [1, 2, 3, 4, 5];

  const rulesOfThumb = [
    { title: "Under 3 Feet", tip: "Firm pace at the back of the cup. Disregard break unless slope exceeds 3%." },
    { title: "3 to 6 Feet", tip: "1% slope = Inside edge. 2% slope = Left/Right edge. 3% slope = 1 ball outside." },
    { title: "Firm Pace", tip: "A 'aggressive' line reduces calculated break by approximately 25%." },
    { title: "Uphill Putts", tip: "Balls rolling uphill hold their line better. Play roughly 10-15% less break." },
    { title: "Downhill Putts", tip: "Gravity pulls the ball more as it slows. Double your focus on the 'Apex' of the curve." }
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase italic text-white">Reference <span className="text-emerald-400">Charts</span></h2>
        <button 
          onClick={() => setShowRules(true)}
          className="text-[10px] font-black text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-full uppercase tracking-widest active:bg-emerald-400/10 transition-colors"
        >
          Rules of Thumb
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white/5 rounded-2xl border border-white/10 shadow-inner">
        <table className="w-full text-left border-collapse min-w-[320px]">
          <thead className="sticky top-0 bg-[#022c22] z-20">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-emerald-400 border-b border-white/10 bg-emerald-950/80 backdrop-blur-md">Dist \ Slope</th>
              {slopes.map(s => (
                <th key={s} className="p-4 text-[10px] font-black uppercase text-center text-emerald-400 border-b border-white/10 bg-emerald-950/80 backdrop-blur-md">{s}%</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {distances.map(d => (
              <tr key={d} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-xs font-black text-white italic bg-white/5">
                  {d} <span className="text-[10px] opacity-40 not-italic uppercase ml-1">FT</span>
                </td>
                {slopes.map(s => {
                  const res = calculateBreak({ distance: d, slopeSide: s, slopeVertical: 0, stimp }, settings);
                  return (
                    <td key={s} className="p-4 text-center text-xs font-bold text-white/80 tabular-nums">
                      {res.breakInches}"
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex justify-between items-center">
        <p className="text-[9px] text-white/40 italic uppercase tracking-[0.2em] font-bold">
          Stimp: <span className="text-emerald-400">{stimp}</span> • Stride: <span className="text-emerald-400">{settings.stepLength}ft</span>
        </p>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30"></div>
        </div>
      </div>

      {/* Rules of Thumb Modal */}
      {showRules && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-emerald-950 w-full max-w-sm rounded-3xl border border-emerald-400/30 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Reader's Rules of Thumb</h3>
              <button onClick={() => setShowRules(false)} className="text-white/40 active:text-white">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {rulesOfThumb.map((rule, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-wider italic">{rule.title}</h4>
                  <p className="text-xs text-white/60 leading-relaxed">{rule.tip}</p>
                </div>
              ))}
            </div>
            <div className="p-6 bg-emerald-900/20">
              <button 
                onClick={() => setShowRules(false)}
                className="w-full py-3 bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                Got it, Caddy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakTable;