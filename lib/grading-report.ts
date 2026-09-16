import { validateCalibration } from "@/lib/calibration";

type GradingRow = Record<string, string | number | null>;
type SpecimenKey = "onion" | "cheek" | "yeast";

const specimens = {
  onion: { label: "양파", divisions: 22, size: 220 },
  cheek: { label: "구강상피세포", divisions: 22, size: 55 },
  yeast: { label: "효모", divisions: 3, size: 7.5 },
} as const;

export const RUBRIC_SUMMARY =
  "보정 6점(10× 3점, 40× 3점); 관찰 4점; 세포별 5점(접안 눈금 수 2점 + 실제 크기: 오차 5% 이하 3점, 10% 이하 2점, 20% 이하 1점, 20% 초과 0점)";

function number(row: GradingRow, key: string) {
  return Number(row[key]);
}

function measurementDetails(row: GradingRow, key: SpecimenKey) {
  const target = specimens[key];
  const divisions = number(row, `${key}_divisions`);
  const size = number(row, `${key}_size`);
  const score = number(row, `${key}_score`);
  const divisionAccurate = Math.abs(divisions - target.divisions) < 0.15;
  const errorRate = Math.abs(size - target.size) / target.size;
  const sizePoints = errorRate <= 0.05 ? 3 : errorRate <= 0.1 ? 2 : errorRate <= 0.2 ? 1 : 0;
  const judgment = score === 5 ? "정확" : score === 4 ? "양호" : score === 3 ? "보통" : score === 2 ? "보완 필요" : score === 1 ? "미흡" : "재측정 필요";
  const evaluation = `${judgment} · 크기 오차 ${(errorRate * 100).toFixed(1)}% · 접안 눈금 수 ${divisionAccurate ? "정확" : "불일치"} · ${score}/5점`;
  const deductions: string[] = [];
  if (!divisionAccurate) deductions.push(`${target.label} 접안 눈금 수 불일치(-2점)`);
  if (sizePoints < 3) deductions.push(`${target.label} 크기 오차 ${(errorRate * 100).toFixed(1)}%(-${3 - sizePoints}점)`);
  return { evaluation, deductions };
}

export function buildGradingEvidence(row: GradingRow) {
  const valid10 = validateCalibration(number(row, "cal_10_ocular"), number(row, "cal_10_stage"), number(row, "cal_10_unit"), 10) === "valid";
  const valid40 = validateCalibration(number(row, "cal_40_ocular"), number(row, "cal_40_stage"), number(row, "cal_40_unit"), 2.5) === "valid";
  const calibrationLevel = valid10 && valid40
    ? "상 · 10×와 40× 보정 모두 정확(6/6점)"
    : valid10 || valid40
      ? `중 · ${valid10 ? "10×" : "40×"} 보정만 정확(3/6점)`
      : "하 · 10×와 40× 보정 모두 재확인 필요(0/6점)";
  const observationScore = number(row, "observation_score");
  const observationLevel = observationScore === 4 ? "상 · 관찰 단계 완료(4/4점)" : "하 · 관찰 단계 미완료(0/4점)";
  const onion = measurementDetails(row, "onion");
  const cheek = measurementDetails(row, "cheek");
  const yeast = measurementDetails(row, "yeast");
  const deductions: string[] = [];
  if (!valid10) deductions.push("10× 보정값 불일치(-3점)");
  if (!valid40) deductions.push("40× 보정값 불일치(-3점)");
  if (observationScore !== 4) deductions.push("관찰 단계 미완료(-4점)");
  deductions.push(...onion.deductions, ...cheek.deductions, ...yeast.deductions);
  return {
    calibrationLevel,
    observationLevel,
    onionEvaluation: onion.evaluation,
    cheekEvaluation: cheek.evaluation,
    yeastEvaluation: yeast.evaluation,
    rubricSummary: RUBRIC_SUMMARY,
    deductionReasons: deductions.length ? deductions.join("; ") : "없음",
  };
}
