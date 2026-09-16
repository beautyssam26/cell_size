"use client";

import { useMemo, useRef, useState } from "react";
import { Aperture, Check, ChevronRight, CircleHelp, Eye, Focus, Lightbulb, Microscope, RefreshCw, Ruler, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateCalibration } from "@/lib/calibration";

type Objective = "10" | "40";
type SpecimenKey = "onion" | "cheek" | "yeast";
const calibration: Record<Objective, { ocular: number; stage: number; unit: number }> = {
  "10": { ocular: 10, stage: 10, unit: 10 },
  "40": { ocular: 40, stage: 10, unit: 2.5 },
};
const specimens: Record<SpecimenKey, { name: string; displayDivisions: number; objective: Objective; color: string; note: string }> = {
  onion: { name: "양파 표피세포", displayDivisions: 22, objective: "10", color: "#b9e8cf", note: "길쭉한 세포의 긴 축을 측정하세요." },
  cheek: { name: "구강 상피세포", displayDivisions: 22, objective: "40", color: "#e9b7cd", note: "핵을 포함한 세포의 가장 넓은 부분을 측정하세요." },
  yeast: { name: "효모", displayDivisions: 3, objective: "40", color: "#f4cc7e", note: "출아 중인 돌기는 제외하고 모세포의 지름을 측정하세요." },
};

function ScaleView({ objective, offset, focus, brightness, onOffsetChange }: { objective: Objective; offset: number; focus: number; brightness: number; onOffsetChange: (value: number) => void }) {
  const ocularCount = objective === "10" ? 20 : 48;
  const ocularStep = objective === "10" ? 18 : 7.5;
  const stageStep = objective === "10" ? 18 : 30;
  const blur = Math.min(Math.abs(focus - 72) / 9, 5);
  const dragRef = useRef<{ x: number; offset: number } | null>(null);
  const clampOffset = (value: number) => Math.max(-40, Math.min(40, value));
  return <div className="scope-view draggable-scope" style={{ filter: `brightness(${0.55 + brightness / 145})` }}>
    <svg viewBox="0 0 420 420" role="slider" tabIndex={0} aria-label="파란색 재물대 눈금을 좌우로 이동" aria-valuemin={-40} aria-valuemax={40} aria-valuenow={offset}
      onPointerDown={(event) => { dragRef.current = { x: event.clientX, offset }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (!dragRef.current) return; const scale = 420 / event.currentTarget.getBoundingClientRect().width; const next = clampOffset(dragRef.current.offset + (event.clientX - dragRef.current.x) * scale); onOffsetChange(Math.abs(next) <= 4 ? 0 : next); }}
      onPointerUp={(event) => { dragRef.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { dragRef.current = null; }}
      onKeyDown={(event) => { if (event.key === "ArrowLeft") onOffsetChange(clampOffset(offset - 1)); if (event.key === "ArrowRight") onOffsetChange(clampOffset(offset + 1)); }}>
      <defs><radialGradient id="lens" cx="45%" cy="40%"><stop offset="0" stopColor="#faffff"/><stop offset=".72" stopColor="#d7f2ef"/><stop offset="1" stopColor="#8cb9b5"/></radialGradient><clipPath id="circle"><circle cx="210" cy="210" r="202"/></clipPath></defs>
      <circle cx="210" cy="210" r="207" fill="#071b24"/><circle cx="210" cy="210" r="198" fill="url(#lens)"/>
      <g clipPath="url(#circle)" style={{ filter: `blur(${blur}px)` }}>
        <g transform={`translate(${offset}, 0)`} stroke="#19788b" strokeWidth="2.4">
          <line x1="30" y1="175" x2="410" y2="175"/>
          {Array.from({ length: objective === "10" ? 22 : 14 }, (_, i) => { const x = 30 + i * stageStep; const major = i % 5 === 0; return <g key={i}><line x1={x} y1="175" x2={x} y2={major ? 225 : 205}/>{major && x < 400 && <text x={x} y="243" textAnchor="middle" fill="#11677a" stroke="none" fontSize="13" fontWeight="700">{i}</text>}</g>; })}
        </g>
        <g stroke="#e24d47" strokeWidth="2"><line x1="22" y1="175" x2="398" y2="175"/>{Array.from({ length: ocularCount + 1 }, (_, i) => { const x = 30 + i * ocularStep; const major = i % 5 === 0; return <g key={i}><line x1={x} y1="175" x2={x} y2={major ? 126 : 145}/>{major && x < 398 && <text x={x} y="116" textAnchor="middle" fill="#a52724" stroke="none" fontSize="13">{i}</text>}</g>; })}</g>
        <text x="24" y="276" fill="#19788b" fontSize="14" fontWeight="700">아래쪽 파란 눈금: 재물대 마이크로미터</text><text x="24" y="301" fill="#b8312d" fontSize="14" fontWeight="700">위쪽 빨간 눈금: 접안 마이크로미터</text>
      </g>
    </svg><div className={`drag-hint ${Math.abs(offset) <= 3 ? "matched" : ""}`}>{Math.abs(offset) <= 3 ? <Check/> : <Target/>}{Math.abs(offset) <= 3 ? "두 눈금의 기준선이 일치했습니다" : "파란 눈금을 좌우로 드래그하세요"}</div><div className="view-chip">대물렌즈 {objective}× · 총 배율 {Number(objective) * 10}×</div>
  </div>;
}

function CellView({ specimen, objective, focus, brightness, stageX, stageY, measuring = false }: { specimen: SpecimenKey; objective: Objective; focus: number; brightness: number; stageX: number; stageY: number; measuring?: boolean }) {
  const info = specimens[specimen], zoom = objective === "40" ? 1.75 : .76, blur = Math.min(Math.abs(focus - 68) / 8, 5), tickStep = 11;
  const measuredWidth = info.displayDivisions * tickStep;
  const onionCells = Array.from({ length: 24 }, (_, i) => ({ x: (i % 6) * 86 - 40, y: Math.floor(i / 6) * 82 - 8 }));
  const cheekCells = Array.from({ length: 13 }, (_, i) => ({ x: 42 + ((i * 91) % 330), y: 48 + ((i * 67) % 310), r: -18 + (i % 5) * 10 }));
  const yeastCells = Array.from({ length: 38 }, (_, i) => ({ x: 30 + ((i * 71) % 360), y: 28 + ((i * 47) % 360), s: 5 + (i % 4) }));
  return <div className="scope-view" style={{ filter: `brightness(${.58 + brightness / 140})` }}><svg viewBox="0 0 420 420" role="img" aria-label={`${info.name} 현미경 시야`}>
    <defs><radialGradient id={`cellLens-${specimen}`} cx="48%" cy="42%"><stop offset="0" stopColor="#fffef7"/><stop offset=".75" stopColor="#e8f6ee"/><stop offset="1" stopColor="#9cb9ad"/></radialGradient><clipPath id={`cellCircle-${specimen}`}><circle cx="210" cy="210" r="198"/></clipPath></defs>
    <circle cx="210" cy="210" r="207" fill="#071b24"/><circle cx="210" cy="210" r="198" fill={`url(#cellLens-${specimen})`}/>
    <g clipPath={`url(#cellCircle-${specimen})`} style={{ filter: `blur(${blur}px)` }}><g transform={`translate(${stageX - 50} ${stageY - 50}) scale(${zoom})`}>
      {!measuring && specimen === "onion" && onionCells.map((c, i) => <g key={i} transform={`translate(${c.x} ${c.y})`}><path d="M3 8 Q40 -3 78 7 L82 69 Q42 82 2 68 Z" fill={i === 14 ? "#93d8b5" : info.color} fillOpacity=".7" stroke="#458a6a" strokeWidth="2"/><ellipse cx="43" cy="38" rx="8" ry="6" fill="#596786" fillOpacity=".78"/></g>)}
      {!measuring && specimen === "cheek" && cheekCells.map((c, i) => <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.r})`}><path d="M-33 -10 Q-25 -39 7 -34 Q38 -29 42 5 Q36 35 2 38 Q-32 30 -38 5 Z" fill={i === 6 ? "#df8fb2" : info.color} fillOpacity=".62" stroke="#a9587c" strokeWidth="1.8"/><circle cx="2" cy="1" r="7" fill="#675477" fillOpacity=".84"/></g>)}
      {!measuring && specimen === "yeast" && yeastCells.map((c, i) => <g key={i} transform={`translate(${c.x} ${c.y})`}><ellipse rx={c.s} ry={c.s * 1.25} fill={i === 17 ? "#e7a83f" : info.color} stroke="#a87120" strokeWidth="1.3"/>{i % 6 === 0 && <circle cx={c.s * .75} cy={-c.s} r={c.s * .55} fill="#f5d68f" stroke="#a87120"/>}</g>)}
    </g>{measuring && <g><line x1="45" y1="300" x2="375" y2="300" stroke="#b72f2a" strokeWidth="2"/>{Array.from({ length: 31 }, (_, i) => { const x = 45 + i * tickStep; return <line key={i} x1={x} y1="300" x2={x} y2={i % 5 === 0 ? 266 : 280} stroke="#b72f2a" strokeWidth="2"/>; })}<g transform={`translate(${210 - measuredWidth / 2} 205)`}>{specimen === "onion" && <path d={`M0 -33 Q${measuredWidth / 2} -48 ${measuredWidth} -30 L${measuredWidth} 31 Q${measuredWidth / 2} 46 0 30 Z`} fill="#88d4ae" fillOpacity=".82" stroke="#3f8665" strokeWidth="3"/>}{specimen === "cheek" && <ellipse cx={measuredWidth / 2} rx={measuredWidth / 2} ry="53" fill="#df91b4" fillOpacity=".78" stroke="#9f4a71" strokeWidth="3"/>}{specimen === "yeast" && <ellipse cx={measuredWidth / 2} rx={measuredWidth / 2} ry="28" fill="#eebd60" fillOpacity=".9" stroke="#9f6b1b" strokeWidth="3"/>}<circle cx={measuredWidth / 2} r={specimen === "yeast" ? 7 : 11} fill="#665778" fillOpacity=".8"/></g><line x1={210 - measuredWidth / 2} y1="146" x2={210 - measuredWidth / 2} y2="326" stroke="#123b49" strokeDasharray="5 5" strokeWidth="2"/><line x1={210 + measuredWidth / 2} y1="146" x2={210 + measuredWidth / 2} y2="326" stroke="#123b49" strokeDasharray="5 5" strokeWidth="2"/></g>}</g>
  </svg><div className="view-chip">{info.name} · 총 배율 {Number(objective) * 10}×</div></div>;
}

function ControlSlider({ label, value, setValue, icon }: { label: string; value: number; setValue: (value: number) => void; icon: React.ReactNode }) {
  return <label className="control-row"><span>{icon}{label}</span><Slider value={[value]} onValueChange={(v) => setValue(v[0])} max={100} step={1} aria-label={label}/><output>{value}</output></label>;
}

export default function Home() {
  const [tab, setTab] = useState("calibrate"), [objective, setObjective] = useState<Objective>("10"), [calFocus, setCalFocus] = useState(32), [brightness, setBrightness] = useState(58), [offset, setOffset] = useState(34), [ocularCountAnswer, setOcularCountAnswer] = useState(""), [stageCountAnswer, setStageCountAnswer] = useState(""), [calAnswer, setCalAnswer] = useState(""), [calFeedback, setCalFeedback] = useState("");
  const [calibrated, setCalibrated] = useState<Record<Objective, boolean>>({ "10": false, "40": false });
  const [calibrationRecords, setCalibrationRecords] = useState<Partial<Record<Objective, { ocular: number; stage: number; unit: number }>>>({});
  const [specimen, setSpecimen] = useState<SpecimenKey>("onion"), [obsObjective, setObsObjective] = useState<Objective>("10"), [obsFocus, setObsFocus] = useState(38), [obsBrightness, setObsBrightness] = useState(62), [stageX, setStageX] = useState(50), [stageY, setStageY] = useState(50), [foundFocus, setFoundFocus] = useState(false);
  const [measureIndex, setMeasureIndex] = useState(0), [divisionAnswer, setDivisionAnswer] = useState(""), [sizeAnswer, setSizeAnswer] = useState(""), [measureFeedback, setMeasureFeedback] = useState("");
  const [measurementRecords, setMeasurementRecords] = useState<Partial<Record<SpecimenKey, { divisions: number; size: number }>>>({});
  const [studentId, setStudentId] = useState(""), [studentName, setStudentName] = useState(""), [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "error">("idle"), [submitMessage, setSubmitMessage] = useState("");
  const measurementKeys: SpecimenKey[] = ["onion", "cheek", "yeast"], taskKey = measurementKeys[measureIndex], task = specimens[taskKey];
  const completed = measurementKeys.filter((key) => Boolean(measurementRecords[key]));
  const focusReady = Math.abs(calFocus - 72) <= 5, aligned = Math.abs(offset) <= 3, bothCalibrated = calibrated["10"] && calibrated["40"], observationReady = Math.abs(obsFocus - 68) <= 5 && obsBrightness >= 45 && obsBrightness <= 80;
  const totalProgress = useMemo(() => Math.round((((calibrated["10"] ? 1 : 0) + (calibrated["40"] ? 1 : 0) + (foundFocus ? 1 : 0) + completed.length) / 6) * 100), [calibrated, foundFocus, completed]);
  function checkCalibration() {
    if (!focusReady) return setCalFeedback("먼저 미동 나사로 눈금의 초점을 선명하게 맞추세요.");
    if (!aligned) return setCalFeedback("파란색 재물대 눈금을 드래그하여 두 눈금의 기준선을 정확히 겹치세요.");

    const result = validateCalibration(
      Number(ocularCountAnswer),
      Number(stageCountAnswer),
      Number(calAnswer),
      calibration[objective].unit,
    );
    if (result === "valid") {
      setCalibrated((p) => ({ ...p, [objective]: true }));
      setCalibrationRecords((p) => ({ ...p, [objective]: { ocular: Number(ocularCountAnswer), stage: Number(stageCountAnswer), unit: Number(calAnswer) } }));
      return setCalFeedback("눈금값의 관계와 보정 계산이 모두 정확합니다.");
    }
    if (result === "missing" || result === "invalid-counts") {
      return setCalFeedback("일치한 두 눈금 수와 계산한 길이를 모두 입력하세요.");
    }
    if (result === "wrong-ratio") {
      return setCalFeedback("두 눈금이 다시 만나는 지점까지 각각 몇 눈금인지 시야에서 세어 보세요.");
    }
    setCalFeedback("눈금 수는 맞았습니다. 계산식을 이용해 보정값을 다시 구해 보세요.");
  }
  function changeCalObjective(value: Objective) { setObjective(value); setOcularCountAnswer(""); setStageCountAnswer(""); setCalAnswer(""); setCalFeedback(""); setOffset(34); setCalFocus(32); }
  function confirmObservation() { if (observationReady) { setFoundFocus(true); setObsFocus(68); } }
  function recordMeasurement() {
    const divisions = Number(divisionAnswer), size = Number(sizeAnswer);
    if (!Number.isFinite(divisions) || !Number.isFinite(size) || divisions <= 0 || size <= 0) return setMeasureFeedback("접안 눈금 수와 계산한 실제 크기를 모두 입력하세요.");
    setMeasurementRecords((p) => ({ ...p, [taskKey]: { divisions, size } }));
    setMeasureFeedback("측정값을 기록했습니다. 정답과 점수는 화면에 표시되지 않습니다.");
  }
  function nextTask() {
    const nextIndex = (measureIndex + 1) % 3, nextKey = measurementKeys[nextIndex], saved = measurementRecords[nextKey];
    setMeasureIndex(nextIndex);
    setDivisionAnswer(saved ? String(saved.divisions) : "");
    setSizeAnswer(saved ? String(saved.size) : "");
    setMeasureFeedback("");
  }
  async function submitAssessment() {
    if (!studentId.trim() || !studentName.trim()) { setSubmitState("error"); return setSubmitMessage("학번과 이름을 입력하세요."); }
    if (!calibrationRecords["10"] || !calibrationRecords["40"] || !foundFocus || completed.length !== 3) { setSubmitState("error"); return setSubmitMessage("1~3단계를 모두 완료한 뒤 제출하세요."); }
    setSubmitState("submitting"); setSubmitMessage("");
    const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: studentId.trim(), studentName: studentName.trim(), calibration: { "10": calibrationRecords["10"], "40": calibrationRecords["40"] }, observationCompleted: foundFocus, measurements: { onion: measurementRecords.onion, cheek: measurementRecords.cheek, yeast: measurementRecords.yeast } }) }).catch(() => null);
    const body = response ? await response.json().catch(() => ({})) as { error?: string } : {};
    if (!response?.ok) { setSubmitState("error"); return setSubmitMessage(body.error ?? "제출하지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    setSubmitState("submitted"); setSubmitMessage("최종 제출이 완료되었습니다. 정답과 점수는 담당 교사에게만 저장됩니다.");
  }

  return <main className="app-shell"><header className="topbar"><div className="brand-mark"><Microscope/></div><div className="brand-copy"><p>세포의 연구 방법 · 가상 실험</p><h1>세포 크기 측정 실험실</h1></div><div className="progress-wrap" aria-label={`전체 진행률 ${totalProgress}%`}><div className="progress-label"><span>실험 진행률</span><b>{totalProgress}%</b></div><div className="progress-track"><span style={{ width: `${totalProgress}%` }}/></div></div></header>
    <Tabs value={tab} onValueChange={setTab} className="lab-tabs"><TabsList className="step-tabs"><TabsTrigger value="calibrate"><span className="step-number">1</span><span><small>STEP 01</small>눈금 보정</span>{bothCalibrated && <Check className="done-icon"/>}</TabsTrigger><TabsTrigger value="observe"><span className="step-number">2</span><span><small>STEP 02</small>표본 관찰</span>{foundFocus && <Check className="done-icon"/>}</TabsTrigger><TabsTrigger value="measure"><span className="step-number">3</span><span><small>STEP 03</small>크기 측정</span>{completed.length === 3 && <Check className="done-icon"/>}</TabsTrigger></TabsList>
      <TabsContent value="calibrate" className="workspace"><section className="viewer-panel"><div className="panel-heading"><div><span className="eyebrow">CALIBRATION VIEW</span><h2>두 눈금을 겹쳐 보정하세요</h2></div><span className={`status-pill ${focusReady && aligned ? "ready" : ""}`}><span/>{focusReady && aligned ? "측정 준비 완료" : "조정 중"}</span></div><ScaleView objective={objective} offset={offset} focus={calFocus} brightness={brightness} onOffsetChange={setOffset}/><div className="legend"><span><i className="red-dot"/>접안 마이크로미터</span><span><i className="blue-dot"/>재물대 마이크로미터 · 드래그 가능</span></div></section>
        <aside className="control-panel"><div className="panel-heading compact"><div><span className="eyebrow">MICROSCOPE CONTROL</span><h2>현미경 조작</h2></div></div><div className="control-block"><label className="field-label">대물렌즈</label><Select value={objective} onValueChange={(v) => changeCalObjective(v as Objective)}><SelectTrigger className="wide-select"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="10">10× 저배율 (총 100×)</SelectItem><SelectItem value="40">40× 고배율 (총 400×)</SelectItem></SelectContent></Select><p className="micro-note">대물렌즈가 바뀌면 반드시 다시 보정합니다.</p></div><div className="control-block sliders"><ControlSlider label="미동 나사 · 초점" value={calFocus} setValue={setCalFocus} icon={<Focus/>}/><ControlSlider label="광량 조절" value={brightness} setValue={setBrightness} icon={<Aperture/>}/></div>
          <div className="calculation-card"><div className="formula-title"><Ruler/>보정값 계산</div><div className="coincidence count-inputs"><label><span>일치한 접안 눈금 수</span><div><Input type="number" value={ocularCountAnswer} onChange={(e) => setOcularCountAnswer(e.target.value)} placeholder="?"/><b>눈금</b></div></label><ChevronRight/><label><span>일치한 재물대 눈금 수</span><div><Input type="number" value={stageCountAnswer} onChange={(e) => setStageCountAnswer(e.target.value)} placeholder="?"/><b>눈금</b></div></label></div><p className="formula">접안 1눈금 = (재물대 눈금 수 × 10 μm) ÷ 접안 눈금 수</p><label className="answer-field"><span>접안 1눈금의 길이</span><div><Input type="number" value={calAnswer} onChange={(e) => setCalAnswer(e.target.value)} placeholder="계산값 입력"/><b>μm</b></div></label><Button onClick={checkCalibration} className="action-button">보정값 확인 <ChevronRight/></Button>{calFeedback && <div className={`feedback ${calibrated[objective] ? "success" : ""}`}>{calibrated[objective] ? <Check/> : <CircleHelp/>}{calFeedback}</div>}</div>{bothCalibrated && <Button onClick={() => setTab("observe")} variant="outline" className="next-button">표본 관찰로 이동 <ChevronRight/></Button>}</aside></TabsContent>
      <TabsContent value="observe" className="workspace"><section className="viewer-panel"><div className="panel-heading"><div><span className="eyebrow">SPECIMEN VIEW</span><h2>표본을 선명하게 관찰하세요</h2></div><span className={`status-pill ${observationReady ? "ready" : ""}`}><span/>{observationReady ? "초점 적합" : "초점 탐색 중"}</span></div><CellView specimen={specimen} objective={obsObjective} focus={obsFocus} brightness={obsBrightness} stageX={stageX} stageY={stageY}/><div className="tip-strip"><Lightbulb/><span><b>관찰 원칙</b> 저배율에서 표본을 찾고 시야 중앙에 놓은 뒤 고배율로 전환하세요.</span></div></section>
        <aside className="control-panel"><div className="panel-heading compact"><div><span className="eyebrow">OBSERVATION CONTROL</span><h2>관찰 조건</h2></div></div><div className="control-block two-fields"><label><span className="field-label">표본</span><Select value={specimen} onValueChange={(v) => setSpecimen(v as SpecimenKey)}><SelectTrigger className="wide-select"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="onion">양파 표피세포</SelectItem><SelectItem value="cheek">구강 상피세포</SelectItem><SelectItem value="yeast">효모</SelectItem></SelectContent></Select></label><label><span className="field-label">대물렌즈</span><Select value={obsObjective} onValueChange={(v) => setObsObjective(v as Objective)}><SelectTrigger className="wide-select"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="10">10× 저배율</SelectItem><SelectItem value="40">40× 고배율</SelectItem></SelectContent></Select></label></div><div className="control-block sliders"><ControlSlider label="미동 나사 · 초점" value={obsFocus} setValue={setObsFocus} icon={<Focus/>}/><ControlSlider label="조리개 · 밝기" value={obsBrightness} setValue={setObsBrightness} icon={<Aperture/>}/><ControlSlider label="재물대 X축" value={stageX} setValue={setStageX} icon={<Target/>}/><ControlSlider label="재물대 Y축" value={stageY} setValue={setStageY} icon={<Target/>}/></div><div className="observation-check"><Eye/><div><b>관찰 체크</b><p>핵과 세포 경계가 구분되고 표본이 시야 중앙에 있나요?</p></div></div><Button onClick={confirmObservation} disabled={!observationReady} className="action-button">관찰 상태 기록 <Check/></Button>{foundFocus && <div className="feedback success"><Check/>선명한 관찰 상태를 기록했습니다.</div>}{foundFocus && <Button onClick={() => setTab("measure")} variant="outline" className="next-button">크기 측정으로 이동 <ChevronRight/></Button>}</aside></TabsContent>
      <TabsContent value="measure" className="workspace"><section className="viewer-panel"><div className="panel-heading"><div><span className="eyebrow">MEASUREMENT VIEW</span><h2>점선 사이의 눈금을 세세요</h2></div><span className="task-count">문항 {measureIndex + 1} / 3</span></div><CellView specimen={taskKey} objective={task.objective} focus={68} brightness={64} stageX={50} stageY={50} measuring/><div className="tip-strip"><Target/><span><b>측정 기준</b> {task.note}</span></div></section>
        <aside className="control-panel"><div className="panel-heading compact"><div><span className="eyebrow">MEASUREMENT RECORD</span><h2>{task.name} 측정</h2></div><span className="score-chip">기록 {completed.length}/3</span></div><div className="measurement-info"><div><span>사용 대물렌즈</span><b>{task.objective}×</b></div><div><span>보정 상태</span><b>{calibrated[task.objective] ? "보정 완료" : "보정 필요"}</b></div></div>{!bothCalibrated && <div className="warning-card"><CircleHelp/>1단계에서 두 배율의 눈금을 먼저 보정하면 측정 근거를 확인할 수 있습니다.</div>}<div className="record-card"><label className="answer-field"><span>① 세포가 차지한 접안 눈금 수</span><div><Input type="number" value={divisionAnswer} onChange={(e) => setDivisionAnswer(e.target.value)} placeholder="눈금 수" disabled={submitState === "submitted"}/><b>눈금</b></div></label><div className="multiply-mark">× <span>1단계에서 구한 보정값</span></div><label className="answer-field"><span>② 계산한 세포의 실제 크기</span><div><Input type="number" value={sizeAnswer} onChange={(e) => setSizeAnswer(e.target.value)} placeholder="실제 크기" disabled={submitState === "submitted"}/><b>μm</b></div></label><Button onClick={recordMeasurement} className="action-button" disabled={submitState === "submitted"}>측정값 기록 <ChevronRight/></Button>{measureFeedback && <div className={`feedback ${completed.includes(taskKey) ? "success" : ""}`}>{completed.includes(taskKey) ? <Check/> : <CircleHelp/>}{measureFeedback}</div>}</div>{completed.includes(taskKey) && <Button onClick={nextTask} variant="outline" className="next-button" disabled={submitState === "submitted"}><RefreshCw/>다음 표본 측정</Button>}{completed.length === 3 && <div className="submission-card"><div className="submission-title"><Sparkles/><div><b>최종 제출</b><p>세 표본의 측정값을 모두 기록했습니다.</p></div></div><div className="student-fields"><label><span>학번</span><Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="학번 입력" disabled={submitState === "submitted"}/></label><label><span>이름</span><Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="이름 입력" disabled={submitState === "submitted"}/></label></div><p className="final-notice">최종 제출은 한 번만 가능하며, 제출 후 정답과 점수는 공개되지 않습니다.</p><Button onClick={submitAssessment} className="action-button" disabled={submitState === "submitting" || submitState === "submitted"}>{submitState === "submitting" ? "제출 중…" : submitState === "submitted" ? "제출 완료" : "최종 제출"} <Check/></Button>{submitMessage && <div className={`feedback ${submitState === "submitted" ? "success" : ""}`}>{submitState === "submitted" ? <Check/> : <CircleHelp/>}{submitMessage}</div>}</div>}</aside></TabsContent>
    </Tabs><footer><span>단위: 1 mm = 1,000 μm</span><span>2022 개정 교육과정 · 세포와 물질대사</span></footer></main>;
}
