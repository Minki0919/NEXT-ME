import { useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { getMyProfile } from "../api/users";
import {
  getStoredAnalysisTarget,
  getStoredPersonalColorAnalysis,
  getStoredProfile,
  getStoredSkinAnalysis,
  saveProfile,
} from "../utils/storage";
import type { AnalysisTarget } from "../utils/storage";

const EXPANDED_TOP = 13;
const COLLAPSED_TOP = 74;

export default function AnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(getStoredProfile);
  const routeTarget = (location.state as { target?: AnalysisTarget } | null)
    ?.target;
  const target = routeTarget ?? getStoredAnalysisTarget();
  const analysis =
    target === "personalColor"
      ? getStoredPersonalColorAnalysis()
      : getStoredSkinAnalysis();
  const analysisRecord = analysis as Record<string, unknown> | null;
  const targetLabel = target === "personalColor" ? "퍼스널 컬러" : "스킨 타입";
  const detectedResult =
    target === "personalColor"
      ? readStringField(analysisRecord, ["detectedPersonalColor", "personalColor"]) ??
        analysis?.profile?.personalColor ??
        profile?.personalColor
      : readStringField(analysisRecord, ["detectedSkinType", "skinType"]) ??
        analysis?.profile?.skinType ??
        profile?.skinType;
  const rawConfidence =
    target === "personalColor"
      ? readNumberField(analysisRecord, ["personalColorConfidence", "confidence"]) ??
        analysis?.profile?.personalColorConfidence ??
        profile?.personalColorConfidence
      : readNumberField(analysisRecord, ["skinTypeConfidence", "confidence"]) ??
        analysis?.profile?.skinTypeConfidence ??
        profile?.skinTypeConfidence;
  const confidence = normalizeConfidence(rawConfidence);
  const retryRequired = Boolean(analysis?.photoRetryRequired);
  const analysisStatus = retryRequired
    ? "사진 재업로드 필요"
    : analysis && !analysis.completed
      ? "분석 미완료"
      : analysis?.completed
      ? "분석 완료"
      : detectedResult
        ? "프로필 결과"
      : "분석 결과 없음";
  const apiAnalysisMessage = analysis?.analysisMessage?.trim();
  const solutionMessage = retryRequired
    ? analysis?.photoRetryMessage?.trim() || "사진을 다시 촬영해 업로드해 주세요."
    : apiAnalysisMessage ||
      (detectedResult
        ? `${profile?.nickname || "사용자"}님의 ${targetLabel} 진단 결과는 ${detectedResult}입니다.${
            confidence === null ? "" : ` 진단 신뢰도는 ${confidence}%예요.`
          }`
        : `${targetLabel} 분석 결과를 확인할 수 없어요. 사진을 다시 업로드해 주세요.`);
  const pageRef = useRef<HTMLElement | null>(null);
  const dragStartY = useRef(0);
  const dragStartTop = useRef(COLLAPSED_TOP);
  const moved = useRef(false);
  const [sheetTop, setSheetTop] = useState(COLLAPSED_TOP);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let active = true;

    void getMyProfile()
      .then((latestProfile) => {
        if (!active) return;
        saveProfile(latestProfile);
        setProfile(latestProfile);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  function clamp(value: number) {
    return Math.min(COLLAPSED_TOP, Math.max(EXPANDED_TOP, value));
  }

  function pointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartY.current = event.clientY;
    dragStartTop.current = sheetTop;
    moved.current = false;
    setDragging(true);
  }

  function pointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging || !pageRef.current) return;
    const height = pageRef.current.getBoundingClientRect().height;
    if (!height) return;
    const delta = ((event.clientY - dragStartY.current) / height) * 100;
    if (Math.abs(delta) > 1) moved.current = true;

    // AI 솔루션 패널의 드래그 방향을 일반 스크롤과 반대로 적용합니다.
    // 마우스/손가락을 아래로 내리면 패널은 위로, 위로 올리면 패널은 아래로 이동합니다.
    setSheetTop(clamp(dragStartTop.current - delta));
  }

  function pointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);

    const middle = (EXPANDED_TOP + COLLAPSED_TOP) / 2;
    setSheetTop((current) => (current <= middle ? COLLAPSED_TOP : EXPANDED_TOP));
  }

  function toggle() {
    if (moved.current) {
      moved.current = false;
      return;
    }
    setSheetTop((current) =>
      current === EXPANDED_TOP ? COLLAPSED_TOP : EXPANDED_TOP
    );
  }

  return (
    <PinkPage className="analysis-page">
      <section className="analysis-inner" ref={pageRef}>
        <button className="analysis-back" onClick={() => navigate("/upload")}>
          <img src={assets.analysisBack} alt="뒤로가기" />
        </button>

        <h1>{targetLabel} AI 분석 결과</h1>

        <div className="analysis-score">
          <img src={assets.analysisRingBase} alt="" />
          {confidence !== null && (
            <span
              className="analysis-score-progress"
              style={{
                "--analysis-score": `${confidence}%`,
              } as CSSProperties}
            />
          )}
          <strong className={confidence === null ? "missing" : undefined}>
            {confidence === null ? "미제공" : `${confidence}%`}
          </strong>
          <span className="analysis-score-label">신뢰도 점수</span>
        </div>

        <section className="analysis-result-grid">
          <ResultCard label="진단 결과" value={detectedResult || "결과 없음"} />
          <ResultCard
            label="신뢰도"
            value={confidence === null ? "미제공" : `${confidence}%`}
          />
          <ResultCard label="상태" value={analysisStatus} />
        </section>

        <section
          className={`analysis-solution ${dragging ? "dragging" : ""}`}
          style={{ top: `${sheetTop}%` }}
        >
          <button
            type="button"
            className="solution-grabber"
            onClick={toggle}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
          >
            <span />
          </button>

          <div className="solution-content">
            <h2>AI 솔루션</h2>
            <p>
              <em>Next : Me</em>의 {targetLabel} 진단 결과예요.
            </p>
            <p>{solutionMessage}</p>

            <button
              className="solution-next"
              disabled={retryRequired || !detectedResult}
              onClick={() => navigate("/ai-routine")}
              title={retryRequired ? "사진 재업로드가 필요합니다." : !detectedResult ? "분석 결과가 필요합니다." : undefined}
            >
              {retryRequired
                ? "사진을 다시 업로드해 주세요"
                : !detectedResult
                  ? "분석 결과가 필요합니다"
                  : "AI 맞춤 루틴 보기"}
            </button>
          </div>
        </section>
      </section>
    </PinkPage>
  );
}

function readStringField(
  source: Record<string, unknown> | null,
  keys: string[]
) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function readNumberField(
  source: Record<string, unknown> | null,
  keys: string[]
) {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function normalizeConfidence(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const percent = value >= 0 && value <= 1 ? value * 100 : value;
  return Math.round(Math.min(100, Math.max(0, percent)));
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="analysis-result-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
