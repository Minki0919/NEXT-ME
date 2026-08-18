import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { MissingFieldsNotice } from "../components/FormParts";
import { assets } from "../assets";
import { ApiError } from "../api/http";
import { getPostLoginPath, loginAndPrepareUser } from "../auth/loginFlow";

// 로그인 성공 후 JWT를 저장하고 공개 온보딩 템플릿을 준비합니다.
export default function EmailLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUsername = (location.state as { username?: string } | null)?.username ?? "";
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canLogin = username.trim().length > 0 && password.length > 0;
  const missingItems = [
    !username.trim() ? "아이디" : "",
    !password ? "비밀번호" : "",
  ].filter(Boolean);

  // 모든 요청은 Gateway를 통하며 /users/sync는 백엔드 내부에서 처리합니다.
  async function handleLogin() {
    if (!canLogin || loading) return;
    setLoading(true);
    setError("");

    try {
      const { profile } = await loginAndPrepareUser(username.trim(), password);
      navigate(getPostLoginPath(profile), {
        replace: true,
      });
    } catch (value) {
      setError(value instanceof ApiError || value instanceof Error ? value.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PinkPage className="email-login-page">
      <header className="email-login-header">
        <button
          type="button"
          className="email-login-back"
          onClick={() => navigate("/login")}
          aria-label="로그인 선택 화면으로 돌아가기"
        >
          <img src={assets.routineBack} alt="" />
        </button>

        <button type="button" className="email-login-logo-button" onClick={() => navigate("/")}>
          <img src={assets.signupLogo} alt="Next : Me" />
        </button>

        <img className="email-login-menu" src={assets.signupMenu} alt="" />
      </header>

      <section className="email-login-copy">
        <h1>
          <strong>Next : Me</strong>에
          <br />
          다시 오신 걸 환영해요.
        </h1>
        <p>아이디로 로그인해주세요.</p>
      </section>

      <section className="email-login-form">
        <label className="line-field">
          <span>아이디</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="아이디를 입력해 주세요."
          />
          <small> </small>
        </label>

        <label className="line-field">
          <span>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="비밀번호를 입력해 주세요."
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleLogin();
            }}
          />
          <small> </small>
        </label>

        {error && <p className="api-status error login-error">{error}</p>}

        <div className="email-login-links">
          <button type="button" onClick={() => navigate("/signup")}>
            회원가입
          </button>
          <span>|</span>
          <button type="button" onClick={() => alert("비밀번호 찾기 API는 전달받지 않아 연결하지 않았습니다.")}>
            비밀번호 찾기
          </button>
        </div>
      </section>

      <MissingFieldsNotice
        id="login-missing-fields"
        items={loading ? [] : missingItems}
        className="bottom-action-missing"
      />

      <button
        type="button"
        className="figma-bottom-button"
        disabled={!canLogin || loading}
        onClick={() => void handleLogin()}
        aria-describedby={missingItems.length > 0 ? "login-missing-fields" : undefined}
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </PinkPage>
  );
}
