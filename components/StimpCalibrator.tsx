
import React, { useState } from 'react';

interface StimpCalibratorProps {
  onApply: (stimp: number) => void;
  onClose: () => void;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

const StimpCalibrator: React.FC<StimpCalibratorProps> = ({ onApply, onClose, triggerHaptic }) => {
  const [step, setStep] = useState(1);
  const [rolls, setRolls] = useState<string[]>(['', '', '']);
  
  const handleRollChange = (index: number, value: string) => {
    const newRolls = [...rolls];
    newRolls[index] = value;
    setRolls(newRolls);
  };

  const rollsComplete = rolls.every(r => r !== '' && !isNaN(parseFloat(r)));
  
  const calculateStimp = () => {
    const numericRolls = rolls.map(r => parseFloat(r));
    const average = numericRolls.reduce((a, b) => a + b, 0) / numericRolls.length;
    // Standard calibration: A 'standard' tour stroke (toe-to-toe) 
    // is designed to roll roughly the stimp value in feet.
    return Math.round(average * 2) / 2;
  };

  const finalStimp = calculateStimp();

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="text-white/40 active:text-white">
          <i className="fas fa-chevron-left mr-2"></i>
          <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
        </button>
        <h2 className="text-xl font-black uppercase italic text-white">Stimp <span className="text-emerald-400">Wizard</span></h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 space-y-6">
        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 text-center">
              <i className="fas fa-info-circle text-emerald-400 text-2xl mb-4"></i>
              <h3 className="text-sm font-black text-white uppercase mb-2">The Reference Roll</h3>
              <p className="text-[11px] text-white/60 leading-relaxed px-2">
                To calculate green speed, perform 3 identical putts using your "Standard Stroke" (e.g., putter head moving from inside of trailing foot to inside of lead foot).
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center font-black text-[10px]">1</div>
                <p className="text-[10px] text-white font-bold uppercase tracking-wide leading-tight mt-1">Find a flat area of the green.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center font-black text-[10px]">2</div>
                <p className="text-[10px] text-white font-bold uppercase tracking-wide leading-tight mt-1">Roll 3 balls with your "toe-to-toe" reference stroke.</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center font-black text-[10px]">3</div>
                <p className="text-[10px] text-white font-bold uppercase tracking-wide leading-tight mt-1">Pace off or measure the distance for each.</p>
              </div>
            </div>

            <button 
              onClick={() => { triggerHaptic('light'); setStep(2); }}
              className="w-full py-4 bg-emerald-500 rounded-2xl text-xs font-black text-emerald-950 uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Start Recording
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 text-center">Enter Distances (Feet)</h3>
              <div className="grid grid-cols-3 gap-3">
                {rolls.map((roll, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-[8px] font-black text-white/30 uppercase tracking-widest block text-center">Putt {i+1}</label>
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={roll}
                      onChange={(e) => handleRollChange(i, e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-emerald-950 border border-white/10 rounded-xl p-3 text-center text-white font-black italic focus:border-emerald-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {rollsComplete && (
              <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-400/30 text-center animate-in zoom-in-95">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Calculated Speed</span>
                <div className="text-5xl font-black text-white italic my-2">
                  {finalStimp} <span className="text-sm">STP</span>
                </div>
                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">Standard Reference Scale</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                disabled={!rollsComplete}
                onClick={() => { triggerHaptic('heavy'); onApply(finalStimp); }}
                className="w-full py-4 bg-emerald-500 disabled:opacity-30 rounded-2xl text-xs font-black text-emerald-950 uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Apply to Reader
              </button>
              <button 
                onClick={() => setStep(1)}
                className="w-full py-3 text-white/40 text-[10px] font-black uppercase tracking-widest active:text-white"
              >
                Reset Test
              </button>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-[9px] text-white/20 text-center uppercase font-black tracking-widest pb-4">
        GreenLight Scientific Calibration v1.0
      </p>
    </div>
  );
};

export default StimpCalibrator;
