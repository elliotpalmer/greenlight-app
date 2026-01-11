
export interface PuttingStats {
  distance: number; // in feet
  slopeSide: number; // percentage (-5 to 5)
  slopeVertical: number; // percentage (-5 to 5)
  stimp: number; // 8 to 13
}

export interface AppSettings {
  stepLength: number; // feet per step, default 3.0
  hapticsEnabled: boolean;
  voiceEnabled: boolean;
  showGrid: boolean;
}

export interface CalculationResult {
  breakInches: number;
  effectiveDistance: number;
  aimPointX: number; // Relative units for UI visualization
  aimPointY: number;
  aimDescription: string; // e.g., "2.5\" Outside Left Edge"
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  stats: PuttingStats;
  results: CalculationResult;
  outcome?: 'make' | 'miss'; // Outcome tracking
}

export interface VisionResult {
  distance: number;
  explanation: string;
}
