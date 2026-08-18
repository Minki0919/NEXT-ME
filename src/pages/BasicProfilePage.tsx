import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { BottomNext, Chips, Question, StepHeader } from "../components/FormParts";
import { getMyProfile, patchMyProfile } from "../api/users";
import { ApiError } from "../api/http";
import {
  getStoredProfile,
  readSurvey,
  saveProfile,
  updateSurvey,
} from "../utils/storage";
import {
  templateOptions,
  templateQuestionText,
  useOnboardingTemplate,
} from "../hooks/useOnboardingTemplate";

// 최신 Figma 기본 프로필 화면(94:44)의 배치/색상을 따릅니다.
// 닉네임은 사용자가 앞서 지정한 질문 순서와 백엔드 PATCH에 필요하므로 유지합니다.
export default function BasicProfilePage() {
  const navigate = useNavigate();
  const template = useOnboardingTemplate();
  const profile = getStoredProfile();
  const survey = readSurvey();
  const [nickname, setNickname] = useState(String(survey.nickname ?? profile?.nickname ?? ""));
  const [gender, setGender] = useState(String(survey.gender ?? ""));
  const [age, setAge] = useState(String(survey.ageGroup ?? profile?.ageGroup ?? ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nicknameQuestion = templateQuestionText(template, "nickname", "닉네임");
  const genderQuestion = templateQuestionText(
    template,
    "gender",
    "성별을 선택해 주세요."
  );
  const genderOptions = templateOptions(template, "gender", ["여성", "남성"]);
  const ageQuestion = templateQuestionText(template, "ageGroup", "연령을 입력해 주세요");
  const missingItems = [
    !nickname.trim() ? "닉네임" : "",
    !gender ? "성별" : "",
    !age ? "연령" : "",
  ].filter(Boolean);

  async function next() {
    if (!nickname.trim() || !gender || !age || loading) return;
    setLoading(true);
    setError("");

    try {
      updateSurvey({ nickname: nickname.trim(), gender, ageGroup: age });

      // PATCH 명세는 nickname/ageGroup만 받고, gender는 마지막 전체 프로필 저장 시 전송합니다.
      const patched = await patchMyProfile({
        nickname: nickname.trim(),
        ageGroup: Number(age),
      });
      saveProfile(patched);
      const current = await getMyProfile();
      saveProfile(current);
      navigate("/profile/work");
    } catch (value) {
      setError(value instanceof ApiError || value instanceof Error ? value.message : "프로필 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PinkPage className="survey-page">
      <StepHeader step={1} total={3} />
      <div className="survey-scroll basic-profile-scroll">
        <p className="profile-greeting">
          <strong>{nickname || "Next : Me"}님</strong>, 안녕하세요 👋
          <br />
          더 딱 맞는 도움을 드릴 수 있도록
          <br />
          기본 정보를 입력해주세요.
        </p>

        <Question title={nicknameQuestion} className="compact-question">
          <input
            className="survey-line-input"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 10))}
            placeholder="2-10자 사이로 입력해 주세요"
          />
        </Question>

        <Question title={genderQuestion}>
          <Chips
            options={genderOptions}
            value={gender}
            onChange={(value) => setGender(value as string)}
          />
        </Question>

        <Question title={ageQuestion}>
          <input
            className="survey-line-input"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            placeholder="숫자 입력"
          />
        </Question>

        {error && <p className="api-status error survey-api-status">{error}</p>}
        <div className="scroll-spacer" />
      </div>

      <BottomNext
        onClick={() => void next()}
        disabled={missingItems.length > 0 || loading}
        missingItems={loading ? [] : missingItems}
      >
        {loading ? "저장 중..." : "다음으로 넘어가기"}
      </BottomNext>

    </PinkPage>
  );
}
