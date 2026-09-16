import { env } from "cloudflare:workers";
import { isTeacherRequest } from "@/lib/teacher-auth";

export async function GET(request: Request) {
  if (!(await isTeacherRequest(request))) return Response.json({ error: "권한이 없습니다." }, { status: 401 });
  const result = await env.DB.prepare(`
    SELECT id, student_id, student_name, onion_size, cheek_size, yeast_size,
      calibration_score, observation_score, onion_score, cheek_score, yeast_score,
      total_score, datetime(submitted_at, '+9 hours') AS submitted_at_kst
    FROM submissions ORDER BY student_id ASC
  `).all();
  return Response.json({ results: result.results }, { headers: { "Cache-Control": "no-store" } });
}
