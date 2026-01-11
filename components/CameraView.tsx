
import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied or unavailable.");
        console.error(err);
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex justify-between items-center p-4">
        <button onClick={onClose} className="text-white text-xl">
          <i className="fas fa-times"></i>
        </button>
        <span className="text-white font-bold text-xs tracking-widest uppercase">Visual Calibration</span>
        <div className="w-8"></div>
      </div>

      <div className="relative flex-1 bg-neutral-900 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-400 font-bold uppercase text-xs">{error}</div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Guide Grid */}
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20">
               <div className="absolute top-1/3 left-0 w-full h-[1px] bg-white/20"></div>
               <div className="absolute top-2/3 left-0 w-full h-[1px] bg-white/20"></div>
               <div className="absolute left-1/3 top-0 w-[1px] h-full bg-white/20"></div>
               <div className="absolute left-2/3 top-0 w-[1px] h-full bg-white/20"></div>
            </div>
            {/* Target Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-emerald-400 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
            </div>
          </>
        )}
      </div>

      <div className="p-8 flex justify-center bg-black/80">
        <button 
          onClick={takeSnapshot}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500 border-2 border-black/10"></div>
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
