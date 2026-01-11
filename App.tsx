
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { PuttingStats, HistoryEntry, VisionResult, AppSettings } from './types';
import { calculateBreak } from './services/physics';
import { estimateDistanceWithAI } from './services/vision';
import SliderInput from './components/SliderInput';
import Visualizer from './components/Visualizer';
import CameraView from './components/CameraView';
import HistoryLog from './components/HistoryLog';
import Settings from './components/Settings';
import BreakTable from './components/BreakTable';
import StimpCalibrator from './components/StimpCalibrator';
import Practice from './components/Practice';

// Helper functions for audio processing
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [stats, setStats] = useState<PuttingStats>({
    distance: 12,
    slopeSide: 1,
    slopeVertical: 0,
    stimp: 10,
  });

  const [settings, setSettings] = useState<AppSettings>({
    stepLength: 3.0,
    hapticsEnabled: true,
    voiceEnabled: true,
    showGrid: true,
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'leveler' | 'history' | 'settings' | 'charts' | 'stimp_wizard' | 'practice'>('calculator');
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Capture Confirmation State
  const [pendingCapture, setPendingCapture] = useState<string | null>(null);
  const [pendingEstimation, setPendingEstimation] = useState<VisionResult | null>(null);

  // Voice Assistant State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [transcript, setTranscript] = useState({ input: "", output: "" });
  const voiceSessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isTogglingRef = useRef<boolean>(false);

  const results = useMemo(() => calculateBreak(stats, settings), [stats, settings]);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!settings.hapticsEnabled) return;
    if (window.navigator && window.navigator.vibrate) {
      const duration = type === 'light' ? 10 : type === 'medium' ? 30 : 50;
      window.navigator.vibrate(duration);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('greenlight_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
    const savedSettings = localStorage.getItem('greenlight_settings');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('greenlight_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('greenlight_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!permissionGranted) return;
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (activeTab === 'leveler') {
        const sideSlope = Math.min(Math.max(event.gamma ? event.gamma / 1.75 : 0, -5), 5);
        const vertSlope = Math.min(Math.max(event.beta ? event.beta / 1.75 : 0, -5), 5);
        
        setStats(prev => {
          const newSide = Math.round(sideSlope * 2) / 2;
          const newVert = Math.round(vertSlope * 2) / 2;
          
          if (newSide !== prev.slopeSide || newVert !== prev.slopeVertical) {
            triggerHaptic('light');
            if (newSide === 0 && newVert === 0) triggerHaptic('medium');
          }
          
          return { ...prev, slopeSide: newSide, slopeVertical: newVert };
        });
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [permissionGranted, activeTab]);

  const handleTabChange = (tab: 'calculator' | 'leveler' | 'history' | 'settings' | 'charts' | 'stimp_wizard' | 'practice') => {
    triggerHaptic('light');
    setActiveTab(tab);
    if (tab === 'leveler' && !permissionGranted) requestPermission();
  };

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') setPermissionGranted(true);
      } catch (e) { console.error(e); }
    } else {
      setPermissionGranted(true);
    }
  };

  const handleCapture = async (base64: string) => {
    triggerHaptic('medium');
    setShowCamera(false);
    setPendingCapture(base64);
    setIsProcessing(true);
    setProcessingMsg("Scanning Green...");
    try {
      const result = await estimateDistanceWithAI(base64);
      setPendingEstimation(result);
      setIsProcessing(false);
      triggerHaptic('medium');
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const confirmEstimation = () => {
    if (pendingEstimation) {
      triggerHaptic('medium');
      setStats(prev => ({
        ...prev,
        distance: Math.min(Math.max(Math.round(pendingEstimation.distance), 3), 60)
      }));
      setPendingCapture(null);
      setPendingEstimation(null);
    }
  };

  const recapture = () => {
    triggerHaptic('light');
    setPendingCapture(null);
    setPendingEstimation(null);
    setShowCamera(true);
  };

  const toggleVoiceAssistant = async () => {
    if (!settings.voiceEnabled) return;
    
    // Prevent multiple rapid toggles
    if (isTogglingRef.current) {
      console.log('[Voice] Toggle already in progress, ignoring');
      return;
    }
    isTogglingRef.current = true;
    console.log('[Voice] Toggle started');
    
    triggerHaptic('medium');
    if (isVoiceActive) {
      // Clean up audio resources
      console.log('[Voice] Manual close - cleaning up all resources');
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      // Stop audio pipeline before closing contexts
      if (mediaStreamSourceRef.current) {
        console.log('[Voice] Disconnecting media stream source');
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
      }
      if (audioWorkletNodeRef.current) {
        console.log('[Voice] Disconnecting and cleaning up AudioWorklet');
        audioWorkletNodeRef.current.port.onmessage = null;
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
      
      // Stop media tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('[Voice] Stopped media track:', track.kind);
        });
        mediaStreamRef.current = null;
      }
      
      // Close session
      if (voiceSessionRef.current) {
        console.log('[Voice] Closing AI session');
        voiceSessionRef.current.close();
        voiceSessionRef.current = null;
      }
      
      // Close audio contexts last
      if (audioContextsRef.current) {
        console.log('[Voice] Closing audio contexts');
        await audioContextsRef.current.input.close();
        await audioContextsRef.current.output.close();
        audioContextsRef.current = null;
      }
      
      setIsVoiceActive(false);
      setTranscript({ input: "", output: "" });
      console.log('[Voice] Cleanup complete');
      isTogglingRef.current = false;
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputAudioContext, output: outputAudioContext };

      // Load AudioWorklet processor
      console.log('[Voice] Loading AudioWorklet module...');
      await inputAudioContext.audioWorklet.addModule('/audio-processor.js');
      console.log('[Voice] AudioWorklet module loaded successfully');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: async () => {
            console.log('[Voice] Session opened, setting up audio pipeline...');
            const source = inputAudioContext.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const workletNode = new AudioWorkletNode(inputAudioContext, 'audio-processor');
            audioWorkletNodeRef.current = workletNode;
            console.log('[Voice] AudioWorkletNode created');

            workletNode.port.onmessage = (event) => {
              const { type, data, isSpeaking } = event.data;
              
              if (type === 'audio-data') {
                // Only send if session is still active
                if (!voiceSessionRef.current) return;
                
                const pcmBlob = {
                  data: encode(new Uint8Array(data.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromise.then((session) => {
                  if (session && voiceSessionRef.current) {
                    session.sendRealtimeInput({ media: pcmBlob });
                  }
                });
              } else if (type === 'speech-start') {
                console.log('[Voice] Speech started - clearing silence timeout');
                // Clear any pending silence timeout
                if (silenceTimeoutRef.current) {
                  clearTimeout(silenceTimeoutRef.current);
                  silenceTimeoutRef.current = null;
                }
              } else if (type === 'speech-end') {
                console.log('[Voice] Speech ended - starting 2s auto-stop timer');
                // Auto-stop after 2 seconds of silence
                silenceTimeoutRef.current = setTimeout(() => {
                  console.log('[Voice] Auto-stopping due to silence');
                  toggleVoiceAssistant();
                }, 2000);
              }
            };

            source.connect(workletNode);
            workletNode.connect(inputAudioContext.destination);
            console.log('[Voice] Audio pipeline connected');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              console.log('[Voice] Input transcription:', text);
              // API sends cumulative text, so just replace
              setTranscript(prev => ({ ...prev, input: text }));
            }
            if (message.serverContent?.outputTranscription) {
              console.log('[Voice] Output transcription:', message.serverContent.outputTranscription.text);
              setTranscript(prev => ({ ...prev, output: message.serverContent!.outputTranscription!.text }));
            }
            if (message.toolCall) {
              console.log('[Voice] Tool call received:', message.toolCall);
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'updatePuttingStats') {
                  console.log('[Voice] Updating stats with args:', fc.args);
                  const args = fc.args as any;
                  const newStats = {
                    distance: args.distance ?? stats.distance,
                    slopeSide: args.slopeSide ?? stats.slopeSide,
                    slopeVertical: args.slopeVertical ?? stats.slopeVertical,
                    stimp: args.stimp ?? stats.stimp,
                  };
                  setStats(newStats);
                  triggerHaptic('medium');
                  
                  // Calculate aim point with new stats
                  const newResults = calculateBreak(newStats, settings);
                  const aimDirection = newResults.breakInches > 0 ? 'right' : newResults.breakInches < 0 ? 'left' : 'straight';
                  const aimDistance = Math.abs(newResults.breakInches);
                  console.log('[Voice] Calculated aim point:', aimDistance.toFixed(1), 'inches', aimDirection);
                  
                  sessionPromise.then((session) => {
                    session.sendToolResponse({
                      functionResponses: { 
                        id: fc.id, 
                        name: fc.name, 
                        response: { 
                          result: "ok",
                          aimPoint: `Aim ${aimDistance.toFixed(1)} inches ${aimDirection}`,
                          distance: newStats.distance,
                          slope: newStats.slopeSide
                        } 
                      }
                    });
                  });
                }
              }
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              console.log('[Voice] Received audio response, duration:', base64Audio.length, 'bytes');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              console.log('[Voice] Audio buffer decoded, duration:', audioBuffer.duration.toFixed(2), 's');
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('[Voice] Error:', e);
            setIsVoiceActive(false);
          },
          onclose: () => {
            console.log('[Voice] Session closed');
            setIsVoiceActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `You are the 'GreenLight Caddy', a professional tour-grade putting assistant. 
Your goal is to help the user set distance, slope, and green speed using voice commands.

CURRENT LIVE STATE:
- Distance: ${stats.distance}ft
- Side Slope: ${stats.slopeSide}%
- Vertical Slope: ${stats.slopeVertical}%
- Stimp: ${stats.stimp}

COMMAND PARSING RULES:
1. DISTANCE COMMANDS:
   - "3 paces" or "3 steps" -> Convert to feet: 3 * ${settings.stepLength} = ${3 * settings.stepLength}ft
   - "15 feet" or "distance 15" -> updatePuttingStats(distance: 15)

2. SLOPE DIRECTION (CRITICAL):
   - POSITIVE slope = ball breaks RIGHT TO LEFT (aim right of hole)
   - NEGATIVE slope = ball breaks LEFT TO RIGHT (aim left of hole)
   - "Breaking right" or "right to left" or "slope right" -> POSITIVE number
   - "Breaking left" or "left to right" or "slope left" -> NEGATIVE number
   - Example: "2 percent breaking right" -> updatePuttingStats(slopeSide: 2)
   - Example: "3 percent breaking left" -> updatePuttingStats(slopeSide: -3)

3. VERTICAL SLOPE:
   - "Uphill 1 percent" -> updatePuttingStats(slopeVertical: 1)
   - "Downhill 2 percent" -> updatePuttingStats(slopeVertical: -2)

4. COMBINED COMMANDS:
   - "3 paces 2 percent breaking right" -> distance and positive slope
   - "5 feet breaking left 3 percent" -> distance and negative slope

Call 'updatePuttingStats' IMMEDIATELY for every change.
After updating, read back the aim point briefly.
Keep responses under 5 words.`,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          tools: [{
            functionDeclarations: [{
              name: 'updatePuttingStats',
              description: 'Update the putting parameters based on user voice input.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  distance: { type: Type.NUMBER, description: 'Distance to hole in feet.' },
                  slopeSide: { type: Type.NUMBER, description: 'Side slope percentage.' },
                  slopeVertical: { type: Type.NUMBER, description: 'Vertical slope percentage.' },
                  stimp: { type: Type.NUMBER, description: 'Green speed (stimp rating).' },
                }
              }
            }]
          }]
        },
      });
      voiceSessionRef.current = await sessionPromise;
      setIsVoiceActive(true);
      console.log('[Voice] Voice assistant activated successfully');
      isTogglingRef.current = false;
    } catch (err) {
      console.error('[Voice] Mic Access Error:', err);
      isTogglingRef.current = false;
    }
  };

  const saveToHistory = () => {
    triggerHaptic('heavy');
    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      stats: { ...stats },
      results: { ...results }
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 50));
    setProcessingMsg("Logged");
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 800);
  };

  const deleteHistoryEntry = (id: string) => {
    triggerHaptic('medium');
    setHistory(prev => prev.filter(e => e.id !== id));
  };

  const updateHistoryOutcome = (id: string, outcome: 'make' | 'miss' | undefined) => {
    triggerHaptic('light');
    setHistory(prev => prev.map(entry => 
      entry.id === id ? { ...entry, outcome } : entry
    ));
  };

  const clearHistory = () => { if (confirm("Clear session logs?")) { triggerHaptic('heavy'); setHistory([]); } };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col px-4 py-4 pb-24 relative overflow-x-hidden select-none">
      {showCamera && <CameraView onCapture={handleCapture} onClose={() => setShowCamera(false)} />}

      {isProcessing && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-8 bg-emerald-900 rounded-3xl border border-emerald-400/30">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold uppercase text-xs tracking-widest">{processingMsg}</p>
          </div>
        </div>
      )}

      {/* Voice Assistant Toggle */}
      {settings.voiceEnabled && (
        <button 
          onClick={toggleVoiceAssistant}
          className={`fixed bottom-28 right-6 z-40 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 active:scale-90 active:brightness-125 ${isVoiceActive ? 'bg-red-500 scale-110 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/30'}`}
        >
          <div className={`absolute inset-0 rounded-full bg-inherit animate-ping opacity-40 ${isVoiceActive ? 'block' : 'hidden'}`}></div>
          <i className={`fas ${isVoiceActive ? 'fa-microphone-slash' : 'fa-microphone'} text-white text-2xl relative z-10`}></i>
        </button>
      )}

      {/* Transcription Bubble - Debug */}
      {(() => {
        console.log('[Voice] Bubble render check - isVoiceActive:', isVoiceActive, 'transcript.input:', transcript.input);
        return isVoiceActive && transcript.input && (
          <div className="fixed bottom-48 right-6 z-50 max-w-[240px] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="relative">
              {/* Speech bubble tail */}
              <div className="absolute -bottom-2 right-8 w-4 h-4 bg-emerald-600 rotate-45 border-r border-b border-emerald-500/30"></div>
              {/* Speech bubble content */}
              <div className="bg-emerald-600 rounded-2xl p-3 shadow-2xl border border-emerald-500/30 backdrop-blur-sm">
                <p className="text-xs text-emerald-100 font-medium leading-relaxed">{transcript.input}</p>
              </div>
            </div>
          </div>
        );
      })()}

      <header className="py-4 flex justify-between items-center border-b border-emerald-800/30 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-emerald-950 shadow-lg shadow-emerald-500/20">
            <i className="fas fa-bolt-lightning text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">Green<span className="text-emerald-400">Light</span></h1>
            <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest mt-0.5">Pro Green Reading</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => handleTabChange('calculator')} className={`px-4 py-2 rounded-full text-xs font-black transition-all ${activeTab === 'calculator' ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'bg-white/5 text-emerald-400'}`}>READER</button>
           <button onClick={() => handleTabChange('leveler')} className={`px-4 py-2 rounded-full text-xs font-black transition-all ${activeTab === 'leveler' ? 'bg-emerald-500 text-emerald-950 shadow-lg' : 'bg-white/5 text-emerald-400'}`}>LEVEL</button>
        </div>
      </header>

      <main className="flex-1 space-y-6">
        {activeTab === 'settings' ? (
          <Settings settings={settings} onUpdate={setSettings} onCalibrateStimp={() => handleTabChange('stimp_wizard')} onClose={() => handleTabChange('calculator')} />
        ) : activeTab === 'history' ? (
          <HistoryLog 
            history={history} 
            onDelete={deleteHistoryEntry} 
            onUpdateOutcome={updateHistoryOutcome}
            onClear={clearHistory} 
            onClose={() => handleTabChange('calculator')} 
          />
        ) : activeTab === 'charts' ? (
          <BreakTable stimp={stats.stimp} settings={settings} />
        ) : activeTab === 'stimp_wizard' ? (
          <StimpCalibrator 
            onApply={(s) => { setStats({...stats, stimp: s}); handleTabChange('calculator'); }} 
            onClose={() => handleTabChange('settings')} 
            triggerHaptic={triggerHaptic}
          />
        ) : activeTab === 'practice' ? (
          <Practice />
        ) : (
          <>
            {activeTab === 'leveler' && (
              <div className="bg-emerald-900/30 p-6 rounded-3xl border border-emerald-800/50 text-center animate-in fade-in zoom-in-95">
                <h2 className="text-xs font-black uppercase text-emerald-400 mb-6 tracking-[0.2em]">Precision Leveler</h2>
                
                <div className="flex justify-center gap-8 mb-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-emerald-400/60 tracking-widest mb-1">Side Slope</span>
                    <span className="text-xl font-black text-white italic tabular-nums">{stats.slopeSide}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase text-emerald-400/60 tracking-widest mb-1">Vert Slope</span>
                    <span className="text-xl font-black text-white italic tabular-nums">{stats.slopeVertical}%</span>
                  </div>
                </div>

                <div className={`relative w-48 h-48 mx-auto flex items-center justify-center rounded-full border-4 transition-colors duration-300 ${stats.slopeSide === 0 && stats.slopeVertical === 0 ? 'border-emerald-400 bg-emerald-400/10' : 'border-emerald-800'}`}>
                   <div className="absolute w-1 h-full bg-emerald-800/30 left-1/2 -translate-x-1/2"></div>
                   <div className="absolute h-1 w-full bg-emerald-800/30 top-1/2 -translate-y-1/2"></div>
                   <div className={`w-10 h-10 rounded-full shadow-2xl transition-all duration-75 ease-out ${stats.slopeSide === 0 && stats.slopeVertical === 0 ? 'bg-white shadow-white/50 scale-110' : 'bg-emerald-400'}`} style={{ transform: `translate(${stats.slopeSide * 10}px, ${stats.slopeVertical * 10}px)` }}></div>
                </div>
                {!permissionGranted && <button onClick={requestPermission} className="mt-6 bg-emerald-500 px-6 py-2.5 rounded-full text-xs font-black text-emerald-950 uppercase shadow-lg active:scale-95">Activate Leveler</button>}
              </div>
            )}

            <section className="bg-emerald-950/40 p-6 rounded-3xl border border-emerald-800/30 space-y-2">
              <SliderInput label="Distance" unit={`ft`} min={3} max={60} step={1} value={stats.distance} onChange={(v) => { setStats({...stats, distance: v}); triggerHaptic(); }} icon="fa-shoe-prints" />
              <SliderInput label="Side Slope" unit="%" min={-5} max={5} step={0.5} value={stats.slopeSide} onChange={(v) => { setStats({...stats, slopeSide: v}); triggerHaptic(); }} icon="fa-arrows-left-right" />
              <SliderInput label="Vert Slope" unit="%" min={-5} max={5} step={0.5} value={stats.slopeVertical} onChange={(v) => { setStats({...stats, slopeVertical: v}); triggerHaptic(); }} icon="fa-arrows-up-down" />
              <SliderInput label="Green Speed" unit=" stp" min={7} max={14} step={0.5} value={stats.stimp} onChange={(v) => { setStats({...stats, stimp: v}); triggerHaptic(); }} icon="fa-bolt" />
            </section>

            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                   <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Aim Point</span>
                   <span className="text-lg font-black text-white italic text-center h-10 flex items-center uppercase">{results.aimDescription}</span>
                   <span className="text-[10px] text-white/30 uppercase font-bold mt-1">{results.breakInches}" Break</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center">
                   <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest">Plays Like</span>
                   <span className="text-2xl font-black text-white italic">{results.effectiveDistance} <span className="text-sm">FT</span></span>
                   <span className="text-[10px] text-white/30 uppercase font-bold mt-1">{stats.slopeVertical > 0 ? 'Uphill' : stats.slopeVertical < 0 ? 'Downhill' : 'Flat'}</span>
                </div>
              </div>
              <button onClick={saveToHistory} className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-black text-emerald-400 uppercase tracking-widest active:bg-emerald-500/30 transition-all">Store Result</button>
            </section>

            <section className="bg-emerald-900/10 rounded-3xl p-3 border border-emerald-800/20 relative">
              <Visualizer 
                distance={stats.distance} 
                effectiveDistance={results.effectiveDistance} 
                breakInches={results.breakInches} 
                slopeSide={stats.slopeSide}
                showGrid={settings.showGrid}
                pendingImage={pendingCapture}
                pendingEstimation={pendingEstimation}
                onConfirm={confirmEstimation}
                onRecapture={recapture}
              />
              {!pendingCapture && (
                <button onClick={() => setShowCamera(true)} className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center active:scale-90 active:bg-white/20 shadow-xl">
                  <i className="fas fa-camera text-emerald-400 text-sm"></i>
                </button>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-emerald-950/95 backdrop-blur-xl border-t border-emerald-800/30 p-4 flex justify-around items-center z-50">
        <button className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'calculator' ? 'text-emerald-400' : 'text-white/30'}`} onClick={() => handleTabChange('calculator')}>
          <i className="fas fa-golf-ball text-xl"></i>
          <span className="text-[10px] font-black uppercase">Reader</span>
        </button>
        <button className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'practice' ? 'text-emerald-400' : 'text-white/30'}`} onClick={() => handleTabChange('practice')}>
          <i className="fas fa-flag text-xl"></i>
          <span className="text-[10px] font-black uppercase">Drills</span>
        </button>
        <button className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'charts' ? 'text-emerald-400' : 'text-white/30'}`} onClick={() => handleTabChange('charts')}>
          <i className="fas fa-table text-xl"></i>
          <span className="text-[10px] font-black uppercase">Charts</span>
        </button>
        <button className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'history' ? 'text-emerald-400' : 'text-white/30'}`} onClick={() => handleTabChange('history')}>
          <i className="fas fa-history text-xl"></i>
          <span className="text-[10px] font-black uppercase">Logs</span>
        </button>
        <button className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${activeTab === 'settings' || activeTab === 'stimp_wizard' ? 'text-emerald-400' : 'text-white/30'}`} onClick={() => handleTabChange('settings')}>
          <i className="fas fa-cog text-xl"></i>
          <span className="text-[10px] font-black uppercase">Set</span>
        </button>
      </footer>
    </div>
  );
};

export default App;
