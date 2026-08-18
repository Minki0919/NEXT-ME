import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { getTodayRoutine } from "../api/routines";
import type { RoutinePlan } from "../api/types";
import { getAuthSession, getStoredProfile, saveAnalysisTarget } from "../utils/storage";
import dashboardLeaf from "../assets/figma/dashboard-leaf.svg";
import dashboardPalette from "../assets/figma/dashboard-palette.svg";
import dashboardChart from "../assets/figma/dashboard-chart.svg";
import dashboardCalendar from "../assets/figma/dashboard-calendar.svg";

const QUICK_LINKS = [
  { label: "피부 분석", icon: dashboardLeaf, path: "/upload", target: "skinType" as const },
  { label: "퍼스널 컬러", icon: dashboardPalette, path: "/personal-color" },
  { label: "루틴 캘린더", icon: dashboardCalendar, path: "/routine/history" },
  { label: "내 기록", icon: dashboardChart, path: "/charts" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<RoutinePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nickname = getStoredProfile()?.nickname || getAuthSession()?.name || "사용자";

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
    return () => { cancelled = true; };
  }, []);

  const completedCount = routine?.items.filter((item) => item.completed).length ?? 0;
  const totalCount = routine?.items.length ?? 0;
  const progress = normalizePercentage(routine?.completionPercentage ?? 0);
  const nextRoutine = useMemo(
    () => routine?.items.find((item) => !item.completed && !item.expired) ?? routine?.items.find((item) => !item.completed) ?? null,
    [routine]
  );

  return (
    <PinkPage className="home-dashboard-page" scroll>
      <section className="home-dashboard-content">
        <h1>안녕하세요, {nickname}님 👋<br />Next : Me에 오신 걸 환영합니다</h1>

        <section className="home-progress-section" aria-label="오늘의 진행도">
          <div className="home-progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
            <span>{loading ? "…" : `${progress}%`}</span>
          </div>
          <div><h2>오늘의 진행도</h2><p>오늘의 루틴 {completedCount}/{totalCount} 완료</p></div>
        </section>

        <section className="home-next-routine">
          <h2>다음 루틴</h2>
          <button type="button" onClick={() => navigate("/routine/complete")}>
            <span className="home-next-routine-icon">{categoryIcon(nextRoutine?.category)}</span>
            <span><strong>{nextRoutine?.title || (loading ? "불러오는 중" : "예정된 루틴이 없어요")}</strong><time>{formatTime(nextRoutine?.scheduledTime)}</time></span>
            <b aria-hidden="true">›</b>
          </button>
        </section>

        {error && <p className="api-status error home-dashboard-error">{error}</p>}

        <nav className="home-quick-links" aria-label="빠른 이동">
          {QUICK_LINKS.map((link) => (
            <button type="button" key={link.label} onClick={() => {
              if (link.target) saveAnalysisTarget(link.target);
              navigate(link.path);
            }}>
              <img src={link.icon} alt="" /><span>{link.label}</span>
            </button>
          ))}
        </nav>
      </section>
    </PinkPage>
  );
}

function normalizePercentage(value: number) {
  return Math.round(Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0)));
}

function formatTime(value?: string) {
  if (!value) return "--:--";
  return value.slice(0, 5);
}

function categoryIcon(category?: string) {
  if (category === "CLEANSING" || category === "SKIN_CARE") return "🫧";
  if (category === "SLEEP_WAKE") return "☀️";
  if (category === "DIET") return "🍽️";
  if (category === "EXERCISE") return "🏃";
  return "✨";
}
