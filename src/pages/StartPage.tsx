import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { hasValidAuthSession } from "../auth/session";
import { getStoredProfile } from "../utils/storage";
import brandLogo from "../assets/figma/login-logo.png";

export default function StartPage() {
  const navigate = useNavigate();

  function start() {
    if (!hasValidAuthSession()) {
      navigate("/login");
      return;
    }
    navigate(getStoredProfile()?.profileCompleted ? "/home" : "/profile/basic");
  }

  return (
    <PinkPage className="start-page">
      <div className="start-page-logo-wrap" aria-label="Next : Me">
        <img
          className="start-page-logo"
          src={brandLogo}
          alt=""
          onError={(event) => event.currentTarget.classList.add("load-failed")}
        />
        <span aria-hidden="true">Next : Me</span>
      </div>
      <p className="start-page-copy">
        나를 더 잘 아는
        <br />
        스마트한 뷰티 파트너
      </p>
      <button type="button" className="figma-pill-button start-page-button" onClick={start}>
        시작하기
      </button>
    </PinkPage>
  );
}
