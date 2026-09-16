import { env } from "cloudflare:workers";
import { z } from "zod";
import { scoreSubmission } from "@/lib/scoring";

const numberAnswer = z.number().finite().positive().max(10000);
const calibrationEntry = z.object({ ocular: numberAnswer, stage: numberAnswer, unit: numberAnswer });
const measurementEntry = z.object({ divisions: numberAnswer, size: numberAnswer });
const submissionSchema = z.object({
  studentId: z.string().trim().min(1).max(30).regex(/^[0-9A-Za-z가-힣_-]+$/),
  studentName: z.string().trim().min(1).max(30),
  calibration: z.object({ "10": calibrationEntry, "40": calibrationEntry }),
  observationCompleted: z.literal(true),
  measurements: z.object({ onion: measurementEntry, cheek: measurementEntry, yeast: measurementEntry }),
});

export async function POST(request: Request) {
  const parsed = submissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "학번, 이름, 모든 측정값을 확인해 주세요." }, { status: 400 });
  }

  const input = parsed.data;
  const scores = scoreSubmission(input);
  try {
    await env.DB.prepare(`
      INSERT INTO submissions (
        student_id, student_name,
        cal_10_ocular, cal_10_stage, cal_10_unit,
        cal_40_ocular, cal_40_stage, cal_40_unit,
        observation_completed,
        onion_divisions, onion_size, cheek_divisions, cheek_size, yeast_divisions, yeast_size,
        calibration_score, observation_score, onion_score, cheek_score, yeast_score, total_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      input.studentId,
      input.studentName,
      input.calibration["10"].ocular,
      input.calibration["10"].stage,
      input.calibration["10"].unit,
      input.calibration["40"].ocular,
      input.calibration["40"].stage,
      input.calibration["40"].unit,
      1,
      input.measurements.onion.divisions,
      input.measurements.onion.size,
      input.measurements.cheek.divisions,
      input.measurements.cheek.size,
      input.measurements.yeast.divisions,
      input.measurements.yeast.size,
      scores.calibrationScore,
      scores.observationScore,
      scores.onionScore,
      scores.cheekScore,
      scores.yeastScore,
      scores.totalScore,
    ).run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE") || message.includes("idx_submissions_student_id")) {
      return Response.json({ error: "이미 최종 제출된 학번입니다." }, { status: 409 });
    }
    return Response.json({ error: "제출을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
