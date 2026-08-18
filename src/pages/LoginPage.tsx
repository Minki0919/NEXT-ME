import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <PinkPage className="login-page">
      <img className="login-logo" src={assets.loginLogo} alt="Next : Me" />

      <section className="login-actions">
        <button className="figma-pill-button" onClick={() => navigate("/email-login")}>
          로그인하기
        </button>
        <button className="figma-pill-button login-first-start" onClick={() => navigate("/signup")}>
          처음 시작하기
        </button>
      </section>
    </PinkPage>
  );
}
