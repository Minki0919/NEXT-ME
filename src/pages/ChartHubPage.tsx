import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { charts } from "../data/survey";
import {
  getStoredProfile,
  readJson,
  STORAGE_KEYS,
} from "../utils/storage";

export default function ChartHubPage() {
  const navigate = useNavigate();
  const profile = getStoredProfile();
  const selected = {
    ...Object.fromEntries(charts.map((chart) => [chart.id, true])),
    ...readJson<Record<string, boolean>>(STORAGE_KEYS.charts, {}),
  };

  const visible = charts.filter((chart) => selected[chart.id]);

  return (
    <PinkPage className="chart-page" scroll>
      <header className="simple-page-header">
        <button onClick={() => navigate("/game")}>‹</button>
        <h1>내 차트</h1>
      </header>

      <section className="chart-intro">
        <strong>{profile?.nickname || "사용자"}님의 관리 차트</strong>
        <p>피드백 받기로 선택한 항목을 확인할 수 있어요.</p>
      </section>

      <div className="chart-hub-list">
        {visible.length === 0 ? (
          <div className="empty-card">
            선택한 차트가 없습니다.
            <button onClick={() => navigate("/charts/select")}>차트 선택하기</button>
          </div>
        ) : (
          visible.map((chart) => (
            <button
              key={chart.id}
              className="chart-hub-card"
              onClick={() => navigate(chart.id === "routineSkinCare" ? "/user-care" : `/charts/${chart.id}`)}
            >
              <small>{chart.group}</small>
              <strong>{chart.id === "routineSkinCare" ? "피부 관리 성분 추천" : chart.label}</strong>
              <span>›</span>
            </button>
          ))
        )}
        <div className="chart-bottom-space" />
      </div>

      <button className="figma-bottom-button" onClick={() => navigate("/charts/select")}>
        차트 설정
      </button>
    </PinkPage>
  );
}
