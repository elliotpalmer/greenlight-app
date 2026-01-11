import React from 'react';
import { VisionResult } from '../types';

interface VisualizerProps {
  distance: number;
  effectiveDistance: number;
  breakInches: number;
  slopeSide: number;
  showGrid?: boolean;
  // Confirmation props
  pendingImage?: string | null;
  pendingEstimation?: VisionResult | null;
  onConfirm?: () => void;
  onRecapture?: () => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  distance, 
  effectiveDistance, 
  breakInches, 
  slopeSide,
  showGrid = true,
  pendingImage,
  pendingEstimation,
  onConfirm,
  onRecapture
}) => {
  // If we have a pending image and estimation, show the confirmation screen
  if (pendingImage && pendingEstimation) {
    return (
      <div className="relative w-full aspect-[3/4] bg-emerald-950 rounded-3xl overflow-hidden border-4 border-emerald-400/50 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <h3 className="text-white text-xs font-black uppercase tracking-widest text-center">Confirm Estimation</h3>
        </div>
        
        <div className="flex-1 relative">
          <img 
            src={`data:image/jpeg;base64,${pendingImage}`} 
            alt="Captured Green" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur-[1px]"></div>
          
          <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-1 shadow-2xl">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Estimated Distance</span>
            <span className="text-4xl font-black text-white italic">{pendingEstimation.distance} <span className="text-sm">FT</span></span>
            <p className="text-[10px] text-white/60 text-center italic mt-1 px-4 leading-tight">
              {pendingEstimation.explanation || "Analyzed using spatial computer vision."}
            </p>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 bg-emerald-950/90">
          <button 
            onClick={onRecapture}
            className="py-3 px-4 rounded-xl border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest active:bg-white/5 active:scale-95 transition-all"
          >
            <i className="fas fa-redo mr-2"></i> Recapture
          </button>
          <button 
            onClick={onConfirm}
            className="py-3 px-4 rounded-xl bg-emerald-500 text-emerald-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 active:brightness-110 transition-all"
          >
            <i className="fas fa-check mr-2"></i> Use Distance
          </button>
        </div>
      </div>
    );
  }

  // Standard SVG Visualizer Code
  const width = 300;
  const height = 400;
  const ballX = width / 2;
  const ballY = height - 40;
  
  const viewDistanceFeet = Math.max(distance, effectiveDistance, 15);
  const scale = (height - 140) / viewDistanceFeet; 
  const holeY = ballY - (distance * scale);
  const aimY = ballY - (effectiveDistance * scale);
  
  const visualMultiplier = 2.5; 
  const breakOffsetFeet = breakInches / 12;
  const breakOffsetPx = breakOffsetFeet * scale * visualMultiplier;
  
  const aimX = ballX + (slopeSide > 0 ? -breakOffsetPx : breakOffsetPx);
  const isStraight = Math.abs(slopeSide) < 0.1;
  const breakDirection = slopeSide > 0 ? 'Right' : 'Left';

  const holeRadiusInches = 2.125;
  const holeRadiusPx = (holeRadiusInches / 12) * scale * visualMultiplier;
  const leftEdgeX = ballX - holeRadiusPx;
  const rightEdgeX = ballX + holeRadiusPx;

  return (
    <div className="relative w-full aspect-[3/4] bg-emerald-900 rounded-3xl overflow-hidden border-4 border-emerald-800 shadow-inner flex items-center justify-center">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="relative z-10">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
          </marker>
        </defs>

        {showGrid && [5, 10, 15, 20, 30, 40, 50, 60].map(d => (
          d <= viewDistanceFeet && (
            <g key={d}>
              <line x1={0} y1={ballY - d * scale} x2={width} y2={ballY - d * scale} stroke="white" strokeWidth="0.5" opacity="0.05" />
              <text x={10} y={ballY - d * scale - 4} fontSize="7" fill="white" opacity="0.3" fontWeight="bold">{d}FT</text>
            </g>
          )
        ))}

        <line x1={ballX} y1={ballY} x2={ballX} y2={holeY} stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
        
        {!isStraight && (
          <line 
            x1={slopeSide > 0 ? leftEdgeX : rightEdgeX} 
            y1={holeY - 20} 
            x2={slopeSide > 0 ? leftEdgeX : rightEdgeX} 
            y2={holeY + 20} 
            stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 1" opacity="0.5" 
          />
        )}

        <line x1={ballX} y1={ballY} x2={aimX} y2={aimY} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />

        {!isStraight && (
          <g opacity="0.8">
            <line x1={ballX} y1={holeY} x2={aimX} y2={holeY} stroke="#fbbf24" strokeWidth="2" />
            <text x={(ballX + aimX) / 2} y={holeY - 10} textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="black" className="italic">
              {breakInches}" TOTAL
            </text>
          </g>
        )}

        <g>
          <circle cx={ballX} cy={holeY} r={holeRadiusPx + 4} fill="#000" stroke="#10b981" strokeWidth="1" opacity="0.4" />
          <circle cx={ballX} cy={holeY} r={holeRadiusPx} fill="#111" />
          <text x={ballX} y={holeY + 30} textAnchor="middle" fill="white" fontSize="9" fontWeight="black" opacity="0.6" className="uppercase tracking-widest">Cup</text>
        </g>
        
        <g transform={`translate(${aimX}, ${aimY})`}>
          <circle cx="0" cy="0" r="14" fill="#fbbf24" fillOpacity="0.1" className="animate-pulse" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#fbbf24" strokeWidth="1.5" />
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#fbbf24" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="4" fill="#fbbf24" className="animate-glow" />
        </g>

        <path d={`M ${ballX} ${ballY} Q ${aimX} ${ballY - (ballY - holeY) * 0.6} ${ballX} ${holeY}`} stroke="#fbbf24" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="6 3" opacity="0.9" />

        <g>
          <ellipse cx={ballX} cy={ballY + 4} rx="6" ry="3" fill="black" opacity="0.3" />
          <circle cx={ballX} cy={ballY} r="7" fill="white" stroke="#ccc" strokeWidth="0.5" />
        </g>
      </svg>
      
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        <div className="flex flex-col gap-1">
           <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isStraight ? 'bg-white' : 'bg-fbbf24 animate-pulse'}`} style={{ backgroundColor: isStraight ? '#fff' : '#fbbf24' }}></div>
              <span className="text-[10px] text-white font-black uppercase tracking-widest">
                {isStraight ? 'Straight' : `Breaks ${breakDirection}`}
              </span>
           </div>
        </div>
        
        <div className="bg-emerald-400 text-emerald-950 px-3 py-1.5 rounded-xl font-black italic text-xs shadow-xl flex items-center gap-2">
          <i className="fas fa-bullseye"></i>
          {breakInches === 0 ? 'CENTER CUT' : `${breakInches}" FROM CENTER`}
        </div>
      </div>
    </div>
  );
};

export default Visualizer;