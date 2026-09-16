export type CalibrationCheck =
  | "valid"
  | "missing"
  | "invalid-counts"
  | "wrong-ratio"
  | "wrong-answer";

export function validateCalibration(
  ocularCount: number,
  stageCount: number,
  answer: number,
  expectedUnit: number,
): CalibrationCheck {
  if (![ocularCount, stageCount, answer].every(Number.isFinite)) return "missing";
  if (ocularCount <= 0 || stageCount <= 0) return "invalid-counts";

  // Students may use any pair of coincident marks (for example 5:5 or 10:10).
  // What matters is the ratio represented by the two scales, not one hidden pair.
  const unitFromCounts = (stageCount * 10) / ocularCount;
  if (Math.abs(unitFromCounts - expectedUnit) >= 0.05) return "wrong-ratio";
  if (Math.abs(answer - unitFromCounts) >= 0.05) return "wrong-answer";
  return "valid";
}
