
import React from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onCalibrateStimp: () => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onCalibrateStimp, onClose }) => {
  const toggle = (key: keyof AppSettings) => {
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  const setStepLength = (val: number) => {
    onUpdate({ ...settings, stepLength: val });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase italic text-white">System <span className="text-emerald-400">Settings</span></h2>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:bg-white/10">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-1">
        <section className="bg-white/5 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-shoe-prints text-emerald-400"></i>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Step Calibration</h3>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] text-white/40 uppercase font-bold">Stride Length</span>
            <span className="text-xl font-black text-white italic">{settings.stepLength.toFixed(1)} <span className="text-xs">FT</span></span>
          </div>
          <input 
            type="range" min={2.0} max={4.0} step={0.1} 
            value={settings.stepLength}
            onChange={(e) => setStepLength(parseFloat(e.target.value))}
            className="w-full mb-3"
          />
          <p className="text-[10px] text-white/30 italic leading-relaxed">Personalize the calculation engine to match your natural stride across 30ft for pro-level accuracy.</p>
        </section>

        <section className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-bolt text-emerald-400"></i>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Green Calibration</h3>
          </div>
          <p className="text-[10px] text-white/50 mb-4 leading-relaxed font-medium uppercase tracking-wider">Determine today's Stimp speed precisely using a standardized roll test.</p>
          <button 
            onClick={onCalibrateStimp}
            className="w-full py-3 bg-emerald-500 rounded-xl text-[10px] font-black text-emerald-950 uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/10"
          >
            Run Stimp Wizard
          </button>
        </section>

        <section className="space-y-3">
          {[
            { key: 'hapticsEnabled' as const, icon: 'fa-vibration', label: 'Tactile Feedback' },
            { key: 'voiceEnabled' as const, icon: 'fa-microphone', label: 'Voice Assistant' },
            { key: 'showGrid' as const, icon: 'fa-border-all', label: 'Vector Grid Overlay' }
          ].map(opt => (
            <div key={opt.key} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <i className={`fas ${opt.icon} text-emerald-400`}></i>
                <span className="text-xs font-black uppercase tracking-widest text-white">{opt.label}</span>
              </div>
              <button 
                onClick={() => toggle(opt.key)}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings[opt.key] ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings[opt.key] ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          ))}
        </section>

        <section className="p-4 border border-dashed border-white/10 rounded-2xl text-center opacity-40 pb-10">
           <p className="text-[10px] text-white uppercase font-black tracking-[0.2em]">GreenLight Pro v1.0.4</p>
           <p className="text-[9px] text-emerald-400 uppercase font-bold mt-1 tracking-widest">Built for the Tour</p>
        </section>
      </div>
    </div>
  );
};

export default Settings;
