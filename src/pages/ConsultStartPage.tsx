import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { getAuthSession, getStoredProfile } from "../utils/storage";

export default function ConsultStartPage() {
  const navigate = useNavigate();
  const nickname =
    getStoredProfile()?.nickname || getAuthSession()?.name || "사용자";

  return (
    <PinkPage className="consult-start-page">
<header className="consult-header">
  <button
    className="logo-button"
    onClick={() =>
      navigate("/game")
    }
  >
    <img
      src={assets.consultLogo}
      alt="Next : Me"
    />
  </button>
</header>

      <h1>
        <strong>{nickname}</strong>님,
        <br />
        상담을 통해
        <br />
        피부 진단 중심 서비스를 받아보세요
      </h1>

      <div className="consult-art">
        <img src={assets.consultBubble1} alt="" />
        <img src={assets.consultBubble2} alt="" />
        <img src={assets.consultDots} alt="" />
      </div>

      <button className="figma-bottom-button" onClick={() => navigate("/chat")}>
        상담 시작하기
      </button>
    </PinkPage>
  );
}
