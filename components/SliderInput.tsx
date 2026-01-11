import React from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (val: number) => void;
  icon?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({ label, value, min, max, step, unit, onChange, icon }) => {
  const handleDecrement = () => {
    const newVal = Math.round(Math.max(min, value - step) * 100) / 100;
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.round(Math.min(max, value + step) * 100) / 100;
    onChange(newVal);
  };

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-2 px-1">
        <label className="text-xs font-black uppercase tracking-wider text-emerald-400/80 flex items-center gap-2">
          {icon && <i className={`fas ${icon} opacity-50`}></i>}
          {label}
        </label>
        <span className="text-sm font-black text-white tabular-nums">
          {value}<span className="text-[10px] opacity-60 ml-1">{unit}</span>
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white active:bg-white/10 disabled:opacity-10 transition-colors"
        >
          <i className="fas fa-minus text-[10px]"></i>
        </button>

        <div className="flex-1 relative py-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <button 
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white active:bg-white/10 disabled:opacity-10 transition-colors"
        >
          <i className="fas fa-plus text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};

export default SliderInput;