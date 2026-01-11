import React, { useState } from 'react';

interface Drill {
  id: string;
  title: string;
  category: 'Accuracy' | 'Distance' | 'Pressure';
  description: string;
  instructions: string[];
  goal: string;
  icon: string;
}

const drills: Drill[] = [
  {
    id: 'ladder',
    title: 'Distance Ladder',
    category: 'Distance',
    icon: 'fa-stairs',
    description: 'Master distance control by hitting specific benchmarks.',
    instructions: [
      'Place markers at 10ft, 20ft, 30ft, and 40ft.',
      'Putt 2 balls from each station.',
      'All balls must finish within a 3ft circle behind the hole.'
    ],
    goal: '8/8 balls in the safety zone.'
  },
  {
    id: 'clock',
    title: 'Around the Clock',
    category: 'Pressure',
    icon: 'fa-clock',
    description: 'High-pressure short putt drill to build confidence.',
    instructions: [
      'Place 8 balls in a circle around the cup at 3 feet.',
      'Putt each ball in sequence.',
      'If you miss, restart the entire clock.'
    ],
    goal: 'Complete 3 full circles (24 putts) without a miss.'
  },
  {
    id: 'gate',
    title: 'The Pro Gate',
    category: 'Accuracy',
    icon: 'fa-door-open',
    description: 'Ensure your ball starts on the correct line every time.',
    instructions: [
      'Place two tees 1 inch wider than your ball, 1 foot in front of you.',
      'Putt through the gate from 6 feet.',
      'Focus on center contact and square face.'
    ],
    goal: '10 consecutive clean passes through the gate.'
  },
  {
    id: 'spiral',
    title: 'Lag Spiral',
    category: 'Distance',
    icon: 'fa-spinner',
    description: 'Learn to adapt to changing distances rapidly.',
    instructions: [
      'Pace off 15ft, 25ft, 35ft, and 45ft stations.',
      'Putt one ball from each, alternating short and long.',
      'No two consecutive putts from the same spot.'
    ],
    goal: 'Proximity average under 2 feet.'
  }
];

const Practice: React.FC = () => {
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase italic text-white">Pro <span className="text-emerald-400">Practice</span></h2>
      </div>

      {!selectedDrill ? (
        <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-10">
          {drills.map((drill) => (
            <button
              key={drill.id}
              onClick={() => setSelectedDrill(drill)}
              className="bg-white/5 border border-white/10 rounded-3xl p-5 text-left active:scale-[0.98] transition-all hover:bg-white/10 group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                  drill.category === 'Accuracy' ? 'bg-blue-500/20 text-blue-400' :
                  drill.category === 'Distance' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  <i className={`fas ${drill.icon}`}></i>
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 bg-white/5 px-2 py-1 rounded-md">
                  {drill.category}
                </span>
              </div>
              <h3 className="text-lg font-black text-white uppercase italic leading-tight group-hover:text-emerald-400 transition-colors">
                {drill.title}
              </h3>
              <p className="text-[10px] text-white/50 mt-1 font-medium leading-relaxed">
                {drill.description}
              </p>
            </button>
          ))}
          <div className="p-6 border border-dashed border-emerald-500/20 rounded-3xl text-center">
            <p className="text-[9px] text-emerald-400/40 uppercase font-black tracking-widest">More drills coming in Pro Edition</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button 
            onClick={() => setSelectedDrill(null)}
            className="flex items-center gap-2 text-white/40 active:text-white"
          >
            <i className="fas fa-chevron-left text-xs"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Drills</span>
          </button>

          <div className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
              {selectedDrill.title}
            </h3>
            <div className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">
              {selectedDrill.category} FOCUS
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                {selectedDrill.instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-emerald-400 font-black italic">0{idx + 1}</span>
                    <p className="text-xs text-white/80 leading-relaxed font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <i className="fas fa-trophy text-xs"></i>
              <span className="text-[10px] font-black uppercase tracking-widest">Tour Standard Goal</span>
            </div>
            <p className="text-sm text-white font-bold italic leading-tight">
              {selectedDrill.goal}
            </p>
          </div>

          <button 
            className="w-full py-4 bg-emerald-500 rounded-2xl text-xs font-black text-emerald-950 uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            onClick={() => setSelectedDrill(null)}
          >
            Session Complete
          </button>
        </div>
      )}
    </div>
  );
};

export default Practice;