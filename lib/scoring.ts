import { validateCalibration } from "@/lib/calibration";

export type CalibrationEntry = { ocular: number; stage: number; unit: number };
export type MeasurementEntry = { divisions: number; size: number };

const expected = {
  onion: { divisions: 22, size: 220 },
  cheek: { divisions: 22, size: 55 },
  yeast: { divisions: 3, size: 7.5 },
} as const;

export function scoreMeasurement(
  key: keyof typeof expected,
  entry: MeasurementEntry,
): number {
  const target = expected[key];
  const divisionPoints = Math.abs(entry.divisions - target.divisions) < 0.15 ? 2 : 0;
  const errorRate = Math.abs(entry.size - target.size) / target.size;
  const sizePoints = errorRate <= 0.05 ? 3 : errorRate <= 0.1 ? 2 : errorRate <= 0.2 ? 1 : 0;
  return divisionPoints + sizePoints;
}

export function scoreSubmission(input: {
  calibration: { "10": CalibrationEntry; "40": CalibrationEntry };
  observationCompleted: boolean;
  measurements: Record<keyof typeof expected, MeasurementEntry>;
}) {
  const calibrationScore =
    (validateCalibration(input.calibration["10"].ocular, input.calibration["10"].stage, input.calibration["10"].unit, 10) === "valid" ? 3 : 0) +
    (validateCalibration(input.calibration["40"].ocular, input.calibration["40"].stage, input.calibration["40"].unit, 2.5) === "valid" ? 3 : 0);
  const observationScore = input.observationCompleted ? 4 : 0;
  const onionScore = scoreMeasurement("onion", input.measurements.onion);
  const cheekScore = scoreMeasurement("cheek", input.measurements.cheek);
  const yeastScore = scoreMeasurement("yeast", input.measurements.yeast);
  return {
    calibrationScore,
    observationScore,
    onionScore,
    cheekScore,
    yeastScore,
    totalScore: calibrationScore + observationScore + onionScore + cheekScore + yeastScore,
  };
}
