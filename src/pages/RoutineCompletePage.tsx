import { useEffect, useState } from "react";
import PinkPage from "../components/PinkPage";
import { getTodayRoutine, setRoutineItemCompleted } from "../api/routines";
import type { RoutineItem, RoutinePlan } from "../api/types";
import routineProgressRing from "../assets/figma/routine-progress-ring.svg";

export default function RoutineCompletePage() {
  const [routine, setRoutine] = useState<RoutinePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getTodayRoutine()
      .then((result) => {
        if (!cancelled) setRoutine(result);
      })
      .catch((value) => {
        if (!cancelled) setError(value instanceof Error ? value.message : "오늘의 루틴을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(item: RoutineItem) {
    if (loadingId !== null) return;
    if (item.expired) {
      setNotice(`${item.title} 루틴은 ${formatClock(item.deadlineAt)}에 마감되었어요.`);
      return;
    }
    if (!item.editable) {
      setNotice(`${item.title} 루틴은 ${formatClock(item.availableAt)}부터 완료할 수 있어요.`);
      return;
    }

    setLoadingId(item.id);
    setError("");
    setNotice("");
    try {
      setRoutine(await setRoutineItemCompleted(item.id, !item.completed));
    } catch (value) {
      setError(value instanceof Error ? value.message : "루틴 완료 상태를 변경하지 못했습니다.");
    } finally {
      setLoadingId(null);
    }
  }

  const items = routine?.items ?? [];
  const completedCount = items.filter((item) => item.completed).length;
  const progress = normalizePercentage(routine?.completionPercentage ?? 0);

  return (
    <PinkPage className="figma-feature-page routine-complete-page" scroll>
      <header className="figma-feature-header simple">
        <h1>루틴 완료하기</h1>
      </header>

      <main className="routine-complete-content">
        <section className="routine-complete-summary">
          <div
            className="routine-complete-ring"
            style={{
              "--routine-progress": `${progress * 3.6}deg`,
              "--routine-ring-mask": `url(${routineProgressRing})`,
            } as React.CSSProperties}
            role="progressbar"
            aria-label="오늘의 루틴 진행도"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <strong>{progress}%</strong>
          </div>
          <div>
            <h2>오늘의 진행도</h2>
            <p>오늘의 루틴 {completedCount}/{items.length} 완료</p>
          </div>
        </section>

        <h3>오늘의 루틴</h3>
        <section className="routine-complete-list" aria-live="polite">
          {loading && <p>오늘의 루틴을 불러오는 중...</p>}
          {!loading && items.length === 0 && <p>아직 생성된 오늘의 루틴이 없습니다.</p>}
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`${item.completed ? "completed" : ""} ${item.expired ? "expired" : !item.editable ? "waiting" : "available"}`}
              disabled={loadingId !== null}
              aria-pressed={item.completed}
              onClick={() => void toggle(item)}
            >
              <span aria-hidden="true" />
              <b>{item.title}</b>
              <p>{item.description}</p>
              <small>
                실행 {formatCompactTime(item.scheduledTime)} <i>|</i>{" "}
                <strong>마감 {formatCompactTime(item.deadlineAt)}</strong>
              </small>
              <em>{item.completed ? "완료" : item.expired ? "만료" : item.editable ? "진행 가능" : "진행 전"}</em>
            </button>
          ))}
        </section>

        {(error || notice) && (
          <p className={`api-status ${error ? "error" : "success"}`}>{error || notice}</p>
        )}
      </main>
    </PinkPage>
  );
}

function normalizePercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

function formatClock(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${match[2]}`;
}

function formatCompactTime(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}
