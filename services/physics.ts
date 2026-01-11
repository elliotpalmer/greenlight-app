import { PuttingStats, CalculationResult, AppSettings } from '../types';

/**
 * GreenLight Physics Engine
 * Calculates putting physics using the optimized 'Steps' formula.
 */
export const calculateBreak = (stats: PuttingStats, settings: AppSettings): CalculationResult => {
  const { distance, slopeSide, slopeVertical, stimp } = stats;
  const { stepLength } = settings;

  // 1. Calculate Effective Distance (Plays Like)
  const distAdjustment = (slopeVertical / 1.0) * (distance / 10);
  const effectiveDistance = distance + distAdjustment;

  // 2. Convert to Steps using calibrated stride
  const steps = effectiveDistance / (stepLength || 3.0);

  // 3. Apply the Core Formula: (# of steps * 2) - 1
  let baseBreak = (steps * 2) - 1;
  if (baseBreak < 0.5) baseBreak = steps * 0.8;

  // 4. Scale by Side Slope % and Stimp speed
  const stimpFactor = stimp / 10;
  let totalBreakInches = baseBreak * Math.abs(slopeSide) * stimpFactor;
  totalBreakInches = Math.round(totalBreakInches * 10) / 10;

  const holeRadius = 2.125;
  let aimDescription = "";
  
  if (totalBreakInches <= 0.5) {
    aimDescription = "Center Cut";
  } else {
    const isLeftToRight = slopeSide > 0;
    const targetEdge = isLeftToRight ? "Left Edge" : "Right Edge";
    
    if (totalBreakInches < holeRadius) {
      const insideInches = (holeRadius - totalBreakInches).toFixed(1);
      aimDescription = `In ${targetEdge}`;
    } else {
      const outsideInches = (totalBreakInches - holeRadius).toFixed(1);
      if (outsideInches === "0.0") {
        aimDescription = `On ${targetEdge}`;
      } else {
        aimDescription = `${outsideInches}" Out ${targetEdge}`;
      }
    }
  }

  const aimPointX = (slopeSide > 0 ? -1 : 1) * (totalBreakInches / 12);
  const aimPointY = effectiveDistance;

  return {
    breakInches: totalBreakInches,
    effectiveDistance: Math.round(effectiveDistance * 10) / 10,
    aimPointX,
    aimPointY,
    aimDescription
  };
};