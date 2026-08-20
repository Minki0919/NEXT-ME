import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PinkPage from "../components/PinkPage";
import { MissingFieldsNotice } from "../components/FormParts";

import { assets } from "../assets";

import {
  register,
  sendEmailCode,
  verifyEmailCode,
} from "../api/auth";

import { ApiError } from "../api/http";

import {
  getPostLoginPath,
  loginAndPrepareUser,
} from "../auth/loginFlow";

import {
  STORAGE_KEYS,
  writeJson,
} from "../utils/storage";

const EMAIL_SENT_MESSAGE =
  "인증번호가 이메일로 발송되었습니다.";

const EMAIL_VERIFIED_MESSAGES =
  new Set([
    "이메일 인증이 완료되었습니다.",
    "이미 인증된 이메일입니다.",
  ]);

const REGISTER_SUCCESS_MESSAGE =
  "회원가입 성공";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  const [
    verificationCode,
    setVerificationCode,
  ] = useState("");

  const [codeSent, setCodeSent] =
    useState(false);

  const [verified, setVerified] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [status, setStatus] =
    useState("");

  const [error, setError] =
    useState("");

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  const passwordValid =
    /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(
      password
    );

  const confirmValid =
    password.length > 0 &&
    confirm === password;

  const usernameValid =
    username.trim().length >= 4;

  const nameValid =
    name.trim().length >= 2;

  const verificationCodeValid =
    /^[A-Z0-9]{8}$/.test(
      verificationCode.trim()
    );

  const ready = useMemo(
    () =>
      usernameValid &&
      nameValid &&
      emailValid &&
      passwordValid &&
      confirmValid,
    [
      usernameValid,
      nameValid,
      emailValid,
      passwordValid,
      confirmValid,
    ]
  );

  const missingItems = [
    !usernameValid
      ? "아이디 4자 이상"
      : "",

    !nameValid
      ? "이름 2자 이상"
      : "",

    !emailValid
      ? "올바른 이메일"
      : "",

    !passwordValid
      ? "영문·숫자 포함 비밀번호 8자 이상"
      : "",

    !confirmValid
      ? "비밀번호 확인"
      : "",

    !verified
      ? "이메일 인증 완료"
      : "",
  ].filter(Boolean);

  function showError(
    value: unknown
  ) {
    setStatus("");

    setError(
      value instanceof ApiError ||
        value instanceof Error
        ? value.message
        : "요청 처리 중 오류가 발생했습니다."
    );
  }

  async function handleRegister() {
    if (
      !ready ||
      !verified ||
      loading
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const responseMessage =
        await register({
          username:
            username.trim(),

          password,

          name:
            name.trim(),

          email:
            email.trim(),
        });

      if (
        responseMessage.trim() !==
        REGISTER_SUCCESS_MESSAGE
      ) {
        setStatus("");

        setError(
          responseMessage ||
            "회원가입에 실패했습니다."
        );

        return;
      }

      writeJson(
        STORAGE_KEYS.signup,
        {
          username:
            username.trim(),

          name:
            name.trim(),

          email:
            email.trim(),

          registered: true,
        }
      );

      setStatus(
        "회원가입이 완료되었습니다. 자동 로그인 중입니다."
      );

      const { profile } =
        await loginAndPrepareUser(
          username.trim(),
          password
        );

      navigate(
        getPostLoginPath(profile),
        {
          replace: true,
        }
      );
    } catch (value) {
      showError(value);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode() {
    if (
      !emailValid ||
      loading ||
      verified
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setStatus(
        "인증번호 전송 중..."
      );

      const responseMessage =
        await sendEmailCode(
          email.trim()
        );

      const sent =
        responseMessage.trim() ===
        EMAIL_SENT_MESSAGE;

      setCodeSent(sent);
      setVerified(false);

      setStatus(
        sent
          ? responseMessage
          : ""
      );

      setError(
        sent
          ? ""
          : responseMessage ||
              "인증번호를 전송하지 못했습니다."
      );
    } catch (value) {
      showError(value);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (
      !codeSent ||
      !verificationCodeValid ||
      loading ||
      verified
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const responseMessage =
        await verifyEmailCode(
          email.trim(),
          verificationCode.trim()
        );

      const success =
        EMAIL_VERIFIED_MESSAGES.has(
          responseMessage.trim()
        );

      setVerified(success);

      setStatus(
        success
          ? `${responseMessage} 가입하기를 눌러주세요.`
          : ""
      );

      setError(
        success
          ? ""
          : responseMessage ||
              "이메일 인증에 실패했습니다."
      );
    } catch (value) {
      showError(value);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PinkPage
      className="signup-page"
      scroll
    >
      <header className="signup-brand-header">
        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          aria-label="시작 화면으로 이동"
        >
          <img
            src={
              assets.loginLogo
            }
            alt="Next : Me"
          />
        </button>
      </header>

      <h1 className="signup-title">
        <strong>
          Next : Me
        </strong>
        에 오신걸 환영해요
        <br />
        회원가입을 해주세요.
      </h1>

      <section className="signup-form">
        <label className="line-field neutral">
          <span>아이디</span>

          <input
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            autoComplete="username"
            placeholder="로그인에 사용할 아이디"
          />

          <small>
            {username &&
            !usernameValid
              ? "아이디를 4자 이상 입력해 주세요."
              : " "}
          </small>
        </label>

        <label className="line-field neutral">
          <span>이름</span>

          <input
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            autoComplete="name"
            placeholder="이름을 입력해 주세요."
          />

          <small>
            {name &&
            !nameValid
              ? "이름을 2자 이상 입력해 주세요."
              : " "}
          </small>
        </label>

        <label
          className={`line-field ${
            email &&
            !emailValid
              ? "error"
              : emailValid
                ? "success"
                : ""
          }`}
        >
          <span>이메일</span>

          <input
            value={email}
            onChange={(e) => {
              setEmail(
                e.target.value
              );

              setCodeSent(false);
              setVerified(false);

              setVerificationCode(
                ""
              );

              setStatus("");
              setError("");
            }}
            type="email"
            autoComplete="email"
            placeholder="Nextme@naver.com"
            disabled={verified}
          />

          <small>
            {email
              ? emailValid
                ? "사용 가능한 이메일 형식입니다."
                : "올바른 이메일 형식으로 입력해 주세요."
              : " "}
          </small>
        </label>

        <label
          className={`line-field ${
            password &&
            !passwordValid
              ? "error"
              : passwordValid
                ? "success"
                : ""
          }`}
        >
          <span>비밀번호</span>

          <input
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            type="password"
            autoComplete="new-password"
            placeholder="영문, 숫자 조합, 8자 이상"
          />

          <small>
            {password &&
            !passwordValid
              ? "영문과 숫자를 포함해 8자 이상 입력해 주세요."
              : " "}
          </small>
        </label>

        <label
          className={`line-field neutral ${
            confirm &&
            !confirmValid
              ? "error"
              : confirmValid
                ? "success"
                : ""
          }`}
        >
          <span>
            비밀번호 확인
          </span>

          <input
            value={confirm}
            onChange={(e) =>
              setConfirm(
                e.target.value
              )
            }
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호와 동일하게 입력하세요."
          />

          <small>
            {confirm &&
            !confirmValid
              ? "비밀번호와 동일하게 입력하세요."
              : " "}
          </small>
        </label>

        <button
          type="button"
          className="verify-button"
          disabled={
            !emailValid ||
            loading ||
            verified
          }
          onClick={
            handleSendCode
          }
        >
          {verified
            ? "이메일 인증 완료"
            : !emailValid
              ? "이메일 입력 필요"
              : codeSent
                ? "인증번호 재전송"
                : "인증번호 전송"}
        </button>

        {codeSent &&
          !verified && (
            <div className="verification-block">
              <label className="line-field neutral">
                <span>
                  인증번호
                </span>

                <input
                  value={
                    verificationCode
                  }
                  onChange={(
                    e
                  ) =>
                    setVerificationCode(
                      e.target.value
                        .toUpperCase()
                        .replace(
                          /\s/g,
                          ""
                        )
                        .slice(
                          0,
                          8
                        )
                    )
                  }
                  maxLength={8}
                  autoCapitalize="characters"
                  placeholder="영문 대문자·숫자 8자리"
                />

                <small>
                  {verificationCode &&
                  !verificationCodeValid
                    ? "영문 대문자와 숫자로 구성된 8자리를 입력해 주세요."
                    : " "}
                </small>
              </label>

              <button
                type="button"
                className="verify-button"
                disabled={
                  !verificationCodeValid ||
                  loading
                }
                onClick={
                  handleVerifyCode
                }
              >
                {verificationCodeValid
                  ? "이메일 인증"
                  : "인증번호 8자리 입력 필요"}
              </button>
            </div>
          )}

        {verified && (
          <p className="signup-verification-complete">
            ✓ 이메일 인증이 완료되었습니다.
          </p>
        )}

        {(status ||
          error) && (
          <p
            className={`api-status ${
              error
                ? "error"
                : "success"
            } signup-api-status`}
          >
            {error ||
              status}
          </p>
        )}

        <div className="signup-final-actions">
          <MissingFieldsNotice
            id="signup-missing-fields"
            items={
              loading
                ? []
                : missingItems
            }
            className="signup-missing-notice"
          />

          <button
            type="button"
            className="signup-submit"
            disabled={
              !ready ||
              !verified ||
              loading
            }
            onClick={
              handleRegister
            }
            aria-describedby={
              missingItems.length >
              0
                ? "signup-missing-fields"
                : undefined
            }
          >
            {loading
              ? "처리 중..."
              : verified
                ? "가입하기"
                : "이메일 인증 후 가입하기"}
          </button>
        </div>
      </section>
    </PinkPage>
  );
}