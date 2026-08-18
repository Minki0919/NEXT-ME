import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { charts } from "../data/survey";
import { readJson, STORAGE_KEYS, writeJson } from "../utils/storage";

type ChartValue = string | boolean;
type ChartRecord = Record<string, Record<string, ChartValue>>;

export default function ChartDetailPage() {
  const navigate = useNavigate();
  const { chartId = "" } = useParams();
  const chart = charts.find((item) => item.id === chartId);

  const [done, setDone] = useState(false);
  const [timeA, setTimeA] = useState("");
  const [timeB, setTimeB] = useState("");
  const [memo, setMemo] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  // 차트 상세 화면을 열 때마다 localStorage에서 최신 저장값을 다시 읽습니다.
  // 같은 컴포넌트에서 chartId만 바뀌는 경우까지 정상 대응합니다.
  useEffect(() => {
    const stored = readJson<ChartRecord>(STORAGE_KEYS.chartData, {});
    const initial = stored[chartId] ?? {};

    setDone(Boolean(initial.done));
    setTimeA(String(initial.timeA ?? ""));
    setTimeB(String(initial.timeB ?? ""));
    setMemo(String(initial.memo ?? ""));
    setSavedMessage("");
  }, [chartId]);

  const helper = useMemo(() => {
    if (chartId === "routinePersonalColor") {
      return "퍼스널컬러 분석 결과를 바탕으로 추천받고 싶은 색을 기록해 보세요.";
    }
    return "선택한 피드백 항목의 실천 여부와 메모를 기록할 수 있어요.";
  }, [chartId]);

  if (!chart) {
    return (
      <PinkPage className="chart-page">
        <div className="empty-card detail-empty">
          존재하지 않는 차트입니다.
          <button onClick={() => navigate("/charts")}>돌아가기</button>
        </div>
      </PinkPage>
    );
  }

  function save() {
    // 렌더 시점의 오래된 객체가 아니라 저장 버튼을 누르는 순간
    // localStorage의 최신 전체 데이터를 다시 읽은 뒤 현재 차트만 덮어씁니다.
    const current = readJson<ChartRecord>(STORAGE_KEYS.chartData, {});
    const next: ChartRecord = {
      ...current,
      [chartId]: { done, timeA, timeB, memo },
    };

    writeJson(STORAGE_KEYS.chartData, next);

    // 실제로 저장된 값을 즉시 다시 읽어 확인합니다.
    const verified = readJson<ChartRecord>(STORAGE_KEYS.chartData, {});
    const saved = verified[chartId];

    if (!saved) {
      setSavedMessage("저장에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    setSavedMessage("저장되었습니다.");
    window.setTimeout(() => navigate("/charts"), 300);
  }

  return (
    <PinkPage className="chart-page" scroll>
      <header className="simple-page-header">
        <button onClick={() => navigate("/charts")}>‹</button>
        <h1>{chart.label}</h1>
      </header>

      <section className="chart-detail-card">
        <small>{chart.group}</small>
        <h2>{chart.label}</h2>
        <p>{helper}</p>

        {chartId === "routineSleepWake" ? (
          <>
            <label className="detail-field">
              <span>취침 시간</span>
              <input
                value={timeA}
                onChange={(e) => setTimeA(e.target.value)}
                type="time"
              />
            </label>
            <label className="detail-field">
              <span>기상 시간</span>
              <input
                value={timeB}
                onChange={(e) => setTimeB(e.target.value)}
                type="time"
              />
            </label>
          </>
        ) : (
          <div className="true-false-large">
            <button
              type="button"
              className={done ? "active" : ""}
              onClick={() => setDone(true)}
            >
              True
            </button>
            <button
              type="button"
              className={!done ? "active" : ""}
              onClick={() => setDone(false)}
            >
              False
            </button>
          </div>
        )}

        <label className="detail-field memo-field">
          <span>메모</span>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 기록을 입력해 주세요."
          />
        </label>

        {savedMessage && <p className="api-status chart-api-status">{savedMessage}</p>}
      </section>

      <button type="button" className="figma-bottom-button" onClick={save}>
        저장하기
      </button>
    </PinkPage>
  );
}
