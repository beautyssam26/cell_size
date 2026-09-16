import { env } from "cloudflare:workers";
import { isTeacherRequest } from "@/lib/teacher-auth";
import { buildGradingEvidence } from "@/lib/grading-report";

type Row = Record<string, string | number | null>;

function csvCell(value: string | number | null) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!(await isTeacherRequest(request))) return Response.json({ error: "권한이 없습니다." }, { status: 401 });

  const result = await env.DB.prepare(`
    SELECT student_id, student_name,
      cal_10_ocular, cal_10_stage, cal_10_unit,
      cal_40_ocular, cal_40_stage, cal_40_unit,
      onion_divisions, onion_size, cheek_divisions, cheek_size, yeast_divisions, yeast_size,
      calibration_score, observation_score, onion_score, cheek_score, yeast_score, total_score,
      datetime(submitted_at, '+9 hours') AS submitted_at_kst
    FROM submissions
    ORDER BY student_id ASC
  `).all<Row>();

  const headers = [
    "학번", "이름", "10× 접안눈금", "10× 재물대눈금", "10× 보정값",
    "40× 접안눈금", "40× 재물대눈금", "40× 보정값",
    "양파 접안눈금수", "양파 측정값(μm)", "구강 접안눈금수", "구강 측정값(μm)",
    "효모 접안눈금수", "효모 측정값(μm)", "보정점수(6)", "관찰점수(4)",
    "양파점수(5)", "구강점수(5)", "효모점수(5)", "총점(25)", "제출시각(KST)",
    "보정 수행 수준", "관찰 수행 수준", "양파 측정 오차 및 판정",
    "구강상피세포 측정 오차 및 판정", "효모 측정 오차 및 판정",
    "항목별 채점 기준", "감점 사유",
  ];
  const keys = [
    "student_id", "student_name", "cal_10_ocular", "cal_10_stage", "cal_10_unit",
    "cal_40_ocular", "cal_40_stage", "cal_40_unit", "onion_divisions", "onion_size",
    "cheek_divisions", "cheek_size", "yeast_divisions", "yeast_size", "calibration_score",
    "observation_score", "onion_score", "cheek_score", "yeast_score", "total_score", "submitted_at_kst",
  ];
  const csv = "\uFEFF" + [
    headers.map(csvCell).join(","),
    ...result.results.map((row) => {
      const evidence = buildGradingEvidence(row);
      return [
        ...keys.map((key) => row[key]),
        evidence.calibrationLevel,
        evidence.observationLevel,
        evidence.onionEvaluation,
        evidence.cheekEvaluation,
        evidence.yeastEvaluation,
        evidence.rubricSummary,
        evidence.deductionReasons,
      ].map(csvCell).join(",");
    }),
  ].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename*=UTF-8''cell-size-assessment.csv",
      "Cache-Control": "no-store",
    },
  });
}
