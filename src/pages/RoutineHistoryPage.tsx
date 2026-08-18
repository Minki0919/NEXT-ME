import { useEffect, useMemo, useState } from "react";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { getRoutineCompletionStats } from "../api/routines";
import type { RoutineCompletionStats } from "../api/types";
import { getAuthSession, getStoredProfile } from "../utils/storage";

type HistoryEntry = {
  date: string;
  completedAt: string;
  completionNumber: number;
};

const PAGE_SIZE = 7;

export default function RoutineHistoryPage() {
  const [stats, setStats] = useState<RoutineCompletionStats | null>(null);
  const [rangeDays, setRangeDays] = useState(7);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nickname = getStoredProfile()?.nickname || getAuthSession()?.name || "사용자";

  useEffect(() => {
    let cancelled = false;
    void getRoutineCompletionStats()
      .then((completionStats) => {
        if (cancelled) return;
        setStats(completionStats);
      })
      .catch((value) => {
        if (!cancelled) {
          setError(value instanceof Error ? value.message : "루틴 완료 내역을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo(() => buildHistoryEntries(stats, rangeDays), [stats, rangeDays]);
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const visibleEntries = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeRange(value: number) {
    setRangeDays(value);
    setPage(1);
  }

  return (
    <PinkPage className="figma-feature-page routine-history-page" scroll>
      <header className="figma-feature-header simple"><h1>루틴 완료 조회</h1></header>

      <main className="routine-history-content">
        <p className="routine-history-greeting">
          <strong>{nickname}님</strong>, 안녕하세요 👋
          <br />
          루틴 완료 내역을 조회해보세요!
        </p>

        <label className="routine-history-range">
          <span className="sr-only">조회 기간</span>
          <select value={rangeDays} onChange={(event) => changeRange(Number(event.target.value))}>
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
          </select>
          <img src={assets.formChevronDown} alt="" />
        </label>
        <p className="routine-history-total">누적 100% 완료 <strong>{stats?.totalCompletedCount ?? 0}회</strong></p>

        <section className="routine-history-card" aria-live="polite">
          {loading && <p className="routine-history-state">완료 내역을 불러오는 중...</p>}
          {!loading && !error && visibleEntries.length === 0 && (
            <p className="routine-history-state">선택한 기간에 완료 내역이 없습니다.</p>
          )}
          {visibleEntries.map((entry) => (
            <article className="routine-history-row" key={entry.date}>
              <time dateTime={entry.date}>{formatHistoryDate(entry.date)}</time>
              <span>{formatCompletedTime(entry.completedAt)}</span>
              <strong className="complete">{entry.completionNumber}번째 완료</strong>
            </article>
          ))}
        </section>

        {error && <p className="api-status error routine-history-error">{error}</p>}

        <nav className="routine-history-pagination" aria-label="완료 내역 페이지">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              type="button"
              className={pageNumber === page ? "active" : ""}
              aria-current={pageNumber === page ? "page" : undefined}
              key={pageNumber}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            &gt;
          </button>
        </nav>
      </main>
    </PinkPage>
  );
}

function buildHistoryEntries(
  stats: RoutineCompletionStats | null,
  rangeDays: number
) {
  const entries = (stats?.completions ?? []).map((completion) => ({
      date: completion.completedDate,
      completedAt: completion.completedAt,
      completionNumber: completion.completionNumber,
    }));

  const today = startOfDay(new Date());
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - (rangeDays - 1));

  return entries
    .filter((entry) => {
      const date = parseDate(entry.date);
      return date !== null && date >= cutoff && date <= today;
    })
    .sort((left, right) => `${right.date}${right.completedAt}`.localeCompare(`${left.date}${left.completedAt}`));
}

function formatCompletedTime(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]} 완료` : value;
}

function formatHistoryDate(value: string) {
  const date = parseDate(value);
  if (!date) return value;
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} (${weekdays[date.getDay()]})`;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
