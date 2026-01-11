
import React, { useMemo } from 'react';
import { HistoryEntry } from '../types';

interface HistoryLogProps {
  history: HistoryEntry[];
  onDelete: (id: string) => void;
  onUpdateOutcome: (id: string, outcome: 'make' | 'miss' | undefined) => void;
  onClear: () => void;
  onClose: () => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history, onDelete, onUpdateOutcome, onClear, onClose }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const stats = useMemo(() => {
    const tracked = history.filter(h => h.outcome !== undefined);
    const makes = tracked.filter(h => h.outcome === 'make').length;
    const rate = tracked.length > 0 ? Math.round((makes / tracked.length) * 100) : 0;
    return { makes, total: tracked.length, rate };
  }, [history]);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase italic text-white">Session <span className="text-emerald-400">Logs</span></h2>
        <button onClick={onClear} className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-3 py-1.5 rounded-xl active:bg-red-400/20">Clear All</button>
      </div>

      {history.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-1">Make Rate</span>
            <span className="text-lg font-black text-emerald-400 italic">{stats.rate}%</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-1">Total Putts</span>
            <span className="text-lg font-black text-white italic">{history.length}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-1">Conversion</span>
            <span className="text-lg font-black text-white italic">{stats.makes}/{stats.total}</span>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-emerald-900/40 space-y-4">
          <i className="fas fa-folder-open text-6xl"></i>
          <p className="uppercase font-black tracking-widest text-xs">No Recent Putts</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-6 pr-1">
          {history.map((entry) => (
            <div key={entry.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 relative group">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{formatDate(entry.timestamp)}</span>
                <button onClick={() => onDelete(entry.id)} className="text-white/20 hover:text-red-400 active:scale-90 transition-all">
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="text-xs font-black text-white/60 uppercase">
                  {entry.stats.distance}ft <span className="text-emerald-500 mx-1">/</span> {entry.stats.slopeSide}% S <span className="text-emerald-500 mx-1">/</span> {entry.stats.slopeVertical}% V
                </div>
                <div className="text-lg font-black text-white italic">
                  {entry.results.breakInches}" <span className="text-emerald-400 font-bold uppercase text-[10px]">Break</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdateOutcome(entry.id, entry.outcome === 'make' ? undefined : 'make')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entry.outcome === 'make' ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  <i className="fas fa-circle-check mr-2"></i> Make
                </button>
                <button 
                  onClick={() => onUpdateOutcome(entry.id, entry.outcome === 'miss' ? undefined : 'miss')}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entry.outcome === 'miss' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  <i className="fas fa-circle-xmark mr-2"></i> Miss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryLog;
