import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { generateTodayRoutine, getTodayRoutine } from "../api/routines";
import type { RoutineCategory, RoutineItem, RoutinePlan } from "../api/types";

type Tab = "todo" | "completed";

export default function AiRoutinePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("todo");
  const [routine, setRoutine] = useState<RoutinePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRoutine() {
      try {
        const response = await getTodayRoutine();
        if (!cancelled) setRoutine(response);
      } catch (value) {
        if (!cancelled) {
          setError(value instanceof Error ? value.message : "루틴을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRoutine();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createRoutine() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      setRoutine(await generateTodayRoutine());
    } catch (value) {
      setError(value instanceof Error ? value.message : "루틴을 생성하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const routineItems = [...(routine?.items ?? [])].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );
  const visibleItems = routineItems.filter((item) =>
    tab === "completed" ? item.completed : !item.completed
  );
  const completedCount = routineItems.filter((item) => item.completed).length;
  const todoCount = routineItems.length - completedCount;
  const progress = normalizePercentage(routine?.completionPercentage);
  const hasRoutine = routine?.routineGenerated === true;

  return (
    <PinkPage className="ai-routine-page" scroll>
      <button className="page-back" onClick={() => navigate("/analysis")}>
        <img src={assets.aiRoutineBack} alt="뒤로가기" />
      </button>

      <h1 className="center-page-title">AI 맞춤 루틴</h1>

      <section className="ai-routine-content">
        <h2>
          {routine?.coachMessage ||
            (loading
              ? "맞춤 루틴을 불러오는 중이에요."
              : "아직 생성된 맞춤 루틴이 없어요.")}
        </h2>

        <div className="segmented-control">
          <button
            className={tab === "todo" ? "active" : ""}
            onClick={() => setTab("todo")}
          >
            진행 예정 <span>{todoCount}</span>
          </button>
          <button
            className={tab === "completed" ? "active" : ""}
            onClick={() => setTab("completed")}
          >
            완료 <span>{completedCount}</span>
          </button>
        </div>

        <section className="routine-summary-card">
          <strong>
            {hasRoutine && routine
              ? `${formatRoutineDate(routine.routineDate)} 맞춤 루틴`
              : "루틴 결과 없음"}
          </strong>
          <p>
            {hasRoutine && routine
              ? `${completedCount}/${routineItems.length}개 완료 · ${
                  routine.allCompleted ? "모든 루틴 완료" : "진행 중"
                }`
              : "루틴 만들기를 눌러 맞춤 계획을 생성해 주세요."}
          </p>
          {hasRoutine && routine && (
            <>
              <div
                className="ai-routine-progress"
                role="progressbar"
                aria-label="오늘 루틴 완료율"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="ai-routine-summary-meta">
                완료율 {progress}% · 하루 초기화 {formatClock(routine.resetTime)}
              </p>
            </>
          )}
        </section>

        {visibleItems.map((item) => (
          <RoutineCard key={item.id} item={item} />
        ))}

        {hasRoutine && visibleItems.length === 0 && (
          <section className="ai-product-card">
            <p>
              {tab === "completed"
                ? "완료된 루틴이 없습니다."
                : "남은 루틴이 없습니다."}
            </p>
          </section>
        )}

        {error && <p className="api-status error">{error}</p>}

        <button
          className="figma-pill-button routine-continue"
          disabled={loading}
          onClick={() => (hasRoutine ? navigate("/routine") : navigate("/routine/create"))}
        >
          {loading
            ? "불러오는 중..."
            : hasRoutine
              ? "오늘의 루틴 보기"
              : "루틴 만들기"}
        </button>
      </section>
    </PinkPage>
  );
}

function RoutineCard({ item }: { item: RoutineItem }) {
  return (
    <section className="ai-product-card">
      <h3>
        <span>{item.title}</span>
        <small>{CATEGORY_LABELS[item.category]}</small>
      </h3>
      <img src={assets.aiRoutineLine} alt="" />
      <p>{item.description}</p>
      <div className="ai-routine-item-meta">
        <span>{formatClock(item.scheduledTime)}</span>
        <span>{getItemStatus(item)}</span>
      </div>
      <p className="ai-routine-window">
        실행 가능 {formatClock(item.availableAt)}–{formatClock(item.deadlineAt)}
        {item.completionWindowMinutes > 0
          ? ` · ${item.completionWindowMinutes}분 이내`
          : ""}
      </p>
    </section>
  );
}

const CATEGORY_LABELS: Record<RoutineCategory, string> = {
  CLEANSING: "세안",
  SKIN_CARE: "스킨케어",
  SLEEP_WAKE: "수면·기상",
  DIET: "식사·수분",
  EXERCISE: "운동",
};

function getItemStatus(item: RoutineItem) {
  if (item.completed) return "완료";
  if (item.expired) return "마감됨";
  if (item.editable) return "지금 완료 가능";
  return `${formatClock(item.availableAt)}부터 가능`;
}

function normalizePercentage(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

function formatRoutineDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(
    "ko-KR",
    { month: "long", day: "numeric", weekday: "short" }
  );
}

function formatClock(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;

  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;
  return `${period} ${displayHour}:${minute}`;
}
