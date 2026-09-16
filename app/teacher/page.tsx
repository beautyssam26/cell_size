"use client";

import { FormEvent, useEffect, useState } from "react";
import { Download, LogOut, Microscope } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SubmissionRow = {
  id: number; student_id: string; student_name: string; onion_size: number; cheek_size: number; yeast_size: number;
  calibration_score: number; observation_score: number; onion_score: number; cheek_score: number; yeast_score: number;
  total_score: number; submitted_at_kst: string;
};

export default function TeacherPage() {
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<SubmissionRow[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("cell-size-teacher-password");
    if (saved) void loadResults(saved);
  }, []);

  async function loadResults(value: string) {
    setLoading(true);
    setError("");
    const response = await fetch("/api/submissions/admin", {
      headers: { Authorization: `Bearer ${value}` }, cache: "no-store",
    });
    if (!response.ok) {
      sessionStorage.removeItem("cell-size-teacher-password");
      setRows(null);
      setError(response.status === 401 ? "관리자 비밀번호가 올바르지 않습니다." : "결과를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }
    const data = (await response.json()) as { results: SubmissionRow[] };
    sessionStorage.setItem("cell-size-teacher-password", value);
    setPassword(value);
    setRows(data.results);
    setLoading(false);
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadResults(password);
  }

  function signOut() {
    sessionStorage.removeItem("cell-size-teacher-password");
    setPassword(""); setRows(null); setError("");
  }

  async function downloadCsv() {
    const response = await fetch("/api/submissions/export", { headers: { Authorization: `Bearer ${password}` } });
    if (!response.ok) { setError("파일을 내려받지 못했습니다. 다시 로그인해 주세요."); return; }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "cell-size-assessment.csv"; anchor.click();
    URL.revokeObjectURL(url);
  }

  if (rows === null) {
    return <main className="teacher-shell"><section className="teacher-card"><div className="teacher-login-title"><Microscope/><span><small>TEACHER VIEW</small><h1>교사용 결과 화면</h1></span></div><p>배포할 때 설정한 관리자 비밀번호를 입력하세요. ChatGPT 계정은 필요하지 않습니다.</p><form onSubmit={signIn} className="teacher-login-form"><label htmlFor="teacher-password">관리자 비밀번호</label><input id="teacher-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8}/><button className="download-button" type="submit" disabled={loading}>{loading ? "확인 중…" : "결과 확인"}</button></form>{error && <p className="teacher-error" role="alert">{error}</p>}<Link href="/">실험실로 돌아가기</Link></section></main>;
  }

  return <main className="teacher-shell"><header className="teacher-header"><div><Microscope/><span><small>TEACHER VIEW</small><h1>수행평가 제출 결과</h1></span></div><div className="teacher-actions"><button className="download-button" type="button" onClick={downloadCsv}><Download/>엑셀용 파일 내려받기</button><button className="teacher-signout" type="button" onClick={signOut}><LogOut/>로그아웃</button></div></header>{error && <p className="teacher-error" role="alert">{error}</p>}<section className="teacher-card"><div className="teacher-summary"><b>제출 {rows.length}명</b><span>총점 25점 · 학생 화면에는 정답과 점수를 표시하지 않음</span></div><Table><TableHeader><TableRow><TableHead>학번</TableHead><TableHead>이름</TableHead><TableHead>양파(μm)</TableHead><TableHead>구강(μm)</TableHead><TableHead>효모(μm)</TableHead><TableHead>보정</TableHead><TableHead>관찰</TableHead><TableHead>양파</TableHead><TableHead>구강</TableHead><TableHead>효모</TableHead><TableHead>총점</TableHead><TableHead>제출 시각(KST)</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell>{row.student_id}</TableCell><TableCell>{row.student_name}</TableCell><TableCell>{row.onion_size}</TableCell><TableCell>{row.cheek_size}</TableCell><TableCell>{row.yeast_size}</TableCell><TableCell>{row.calibration_score}/6</TableCell><TableCell>{row.observation_score}/4</TableCell><TableCell>{row.onion_score}/5</TableCell><TableCell>{row.cheek_score}/5</TableCell><TableCell>{row.yeast_score}/5</TableCell><TableCell><b>{row.total_score}/25</b></TableCell><TableCell>{row.submitted_at_kst}</TableCell></TableRow>)}</TableBody></Table>{rows.length === 0 && <p className="empty-results">아직 제출된 결과가 없습니다.</p>}</section></main>;
}
