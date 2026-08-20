import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import routineCalendarIcon from "../assets/figma/routine-calendar.svg";
import routineNotebookIcon from "../assets/figma/routine-notebook.svg";
import { generateTodayRoutine, getTodayRoutine } from "../api/routines";
import type { RoutinePlan } from "../api/types";

export default function RoutineCreatePage() {
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<RoutinePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getTodayRoutine()
      .then((result) => {
        if (!cancelled) setRoutine(result);
      })
      .catch((value) => {
        if (!cancelled) setError(value instanceof Error ? value.message : "생성된 루틴을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function createRoutine() {
    if (creating) return;
    setCreating(true);
    setError("");
    try {
      setRoutine(await generateTodayRoutine());
    } catch (value) {
      setError(value instanceof Error ? value.message : "새 루틴을 만들지 못했습니다.");
    } finally {
      setCreating(false);
    }
  }

  const items = routine?.routineGenerated ? routine.items : [];

  return (
    <PinkPage className="figma-feature-page routine-create-page" scroll>
 <header className="figma-feature-header">
  <h1>
    루틴 만들기
  </h1>
</header>

      <main className="routine-create-content">
        <div className="routine-create-hero" aria-hidden="true">
          <img src={routineCalendarIcon} alt="" />
        </div>
        <h2>나만의 루틴을 만들어<br />건강한 습관을 관리해 보세요.</h2>
        <button
          type="button"
          className="figma-feature-primary"
          disabled={creating || loading}
          onClick={() => void createRoutine()}
        >
          {creating ? "새 루틴 만드는 중..." : "새 루틴 만들기"}
        </button>

        <hr />
        <h3>생성된 루틴</h3>

        {loading ? (
          <section className="routine-created-empty"><span className="feature-loader" /><p>루틴을 확인하고 있어요.</p></section>
        ) : items.length === 0 ? (
          <section className="routine-created-empty">
            <img src={routineNotebookIcon} alt="" />
            <p>아직 생성된 루틴이 없습니다</p>
          </section>
        ) : (
          <button type="button" className="routine-created-card" onClick={() => navigate("/routine/complete")}>
            <header>
              <strong>{formatDate(routine?.routineDate || "")} 루틴</strong>
              <span>{routine?.completionPercentage ?? 0}%</span>
            </header>
            <ul>
              {items.map((item) => (
                <li key={item.id}><b>{item.title}</b><time>{formatClock(item.scheduledTime)}</time></li>
              ))}
            </ul>
            <small>눌러서 오늘의 진행도를 확인하세요</small>
          </button>
        )}

        {error && <p className="api-status error">{error}</p>}
        <button
  type="button"
  className="routine-create-home-button"
  onClick={() => navigate("/home")}
>
  홈으로 가기
</button>
      </main>
    </PinkPage>
  );
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value || "오늘의";
  return `${Number(match[2])}월 ${Number(match[3])}일`;
}

function formatClock(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}
