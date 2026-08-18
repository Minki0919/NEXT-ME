import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { BottomNext, DetailHeader, DropdownQuestion } from "../components/FormParts";
import { defaultPersonalColorDetailQuestions, personalColorDetailQuestionOrder, personalColors } from "../data/survey";
import { templateOptions, templateQuestionText, useOnboardingTemplate } from "../hooks/useOnboardingTemplate";
import { getMyProfile, saveFullProfile, submitOnboardingAnswer, submitPersonalColorDetailFinal } from "../api/users";
import { ApiError } from "../api/http";
import type { OnboardingQuestion } from "../api/types";
import { buildFullProfileRequest } from "../utils/profileMapping";
import {
  readJson,
  readSurvey,
  saveAnalysisTarget,
  savePersonalColorAnalysis,
  savePersonalColorQuestions,
  saveProfile,
  STORAGE_KEYS,
  updateSurvey,
} from "../utils/storage";

const REQUIRED_FIELDS = ["veinColor", "jewelryColor", "lipColor", "overallTone"] as const;
const UNKNOWN_ANSWER = "잘 모르겠어요";
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

function isUnknownAnswer(value: string) {
  return value.replace(/[.。]$/, "") === UNKNOWN_ANSWER;
}

/** 최신 Figma 133:260 기반 퍼스널 컬러 세부 질문 화면 */
export default function PersonalColorDetailPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const template = useOnboardingTemplate();
  const survey = readSurvey();
  const storedQuestions = readJson<OnboardingQuestion[]>(STORAGE_KEYS.personalColorQuestions, []);

  const [personalColor, setPersonalColor] = useState(String(survey.personalColor ?? ""));
  const [dynamicQuestions, setDynamicQuestions] = useState<OnboardingQuestion[]>(storedQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>(Object.fromEntries(REQUIRED_FIELDS.map((key) => [key, ""])));
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const personalColorQuestion = templateQuestionText(template, "personalColor", "당신의 퍼스널 컬러를 입력해 주세요");
  const personalColorOptions = templateOptions(template, "personalColor", personalColors);

  const questions = useMemo(() => {
    const serverMap = new Map(
      dynamicQuestions
        .filter((question) => REQUIRED_FIELDS.includes(question.field as (typeof REQUIRED_FIELDS)[number]))
        .map((question) => [question.field, {
          field: question.field,
          question: question.question,
          options: question.options && question.options.length > 0 ? question.options : ["잘 모르겠어요"],
        }] as const)
    );

    return personalColorDetailQuestionOrder.map((field) => {
      const fromServer = serverMap.get(field);
      if (fromServer) return fromServer;
      const fallback = defaultPersonalColorDetailQuestions.find((question) => question.field === field);
      return {
        field,
        question: fallback?.question ?? field,
        options: fallback ? [...fallback.options] : ["잘 모르겠어요"],
      };
    });
  }, [dynamicQuestions]);

  const showDetailQuestions = isUnknownAnswer(personalColor);
  const allAnswered = !showDetailQuestions || questions.every((question) => Boolean(answers[question.field]));
  const missingItems = [
    !personalColor ? "퍼스널 컬러" : "",
    ...(showDetailQuestions
      ? questions
          .filter((question) => !answers[question.field])
          .map((question) => question.question)
      : []),
  ].filter(Boolean);

  function selectPhoto(nextPhoto: File | null) {
    if (!nextPhoto) return;
    if (!nextPhoto.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (nextPhoto.size > MAX_PHOTO_SIZE) {
      setError("사진은 최대 10MB까지 업로드할 수 있습니다.");
      return;
    }
    setPhoto(nextPhoto);
    setError("");
  }

  async function loadUnknownQuestions(value: string) {
    if (!isUnknownAnswer(value) || dynamicQuestions.length > 0 || loadingQuestions) return;
    setLoadingQuestions(true);
    setError("");
    try {
      const response = await submitOnboardingAnswer("personalColor", UNKNOWN_ANSWER);
      savePersonalColorQuestions(response.nextQuestions);
      if (response.profile) saveProfile(response.profile);
      setDynamicQuestions(response.nextQuestions ?? []);
    } catch (value) {
      setError(value instanceof ApiError || value instanceof Error ? value.message : "퍼스널컬러 세부 질문을 불러오지 못했습니다.");
      throw value;
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function next() {
    if (!personalColor || !allAnswered || loading || loadingQuestions) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      updateSurvey({
        personalColor,
        personalColorDetail: showDetailQuestions ? answers : {},
      });
      if (showDetailQuestions && dynamicQuestions.length === 0) {
        await loadUnknownQuestions(personalColor);
      }

      if (showDetailQuestions) {
        const analysis = await submitPersonalColorDetailFinal(answers, photo);
        savePersonalColorAnalysis(analysis);
        saveAnalysisTarget("personalColor");
        if (analysis.profile) saveProfile(analysis.profile);

        const detected = analysis.detectedPersonalColor ?? analysis.profile?.personalColor ?? personalColor;
        updateSurvey({
          personalColor: detected,
          personalColorConfidence: analysis.personalColorConfidence ?? analysis.profile?.personalColorConfidence ?? undefined,
        });

        if (analysis.photoRetryRequired) {
          setMessage(analysis.photoRetryMessage || "사진을 다시 업로드해 주세요.");
          return;
        }
      }

      const middleProfile = await getMyProfile();
      saveProfile(middleProfile);
      const payload = buildFullProfileRequest(middleProfile);
      const saved = await saveFullProfile(payload);
      saveProfile(saved);
      const finalProfile = await getMyProfile();
      saveProfile(finalProfile);
      navigate("/home", { replace: true });
    } catch (value) {
      setError(value instanceof ApiError || value instanceof Error ? value.message : "퍼스널컬러 분석 또는 프로필 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PinkPage className="survey-page detail-survey-page">
      <DetailHeader title="퍼스널 컬러 세부 질문" />
      <div className="survey-scroll detail-survey-scroll">
        <DropdownQuestion
          title={personalColorQuestion}
          options={personalColorOptions}
          value={personalColor}
          disabled={loadingQuestions}
          onChange={(value) => {
            setPersonalColor(value);
            if (isUnknownAnswer(value)) {
              void loadUnknownQuestions(value).catch(() => undefined);
            } else {
              setDynamicQuestions([]);
              setAnswers(Object.fromEntries(REQUIRED_FIELDS.map((key) => [key, ""])));
              savePersonalColorQuestions(null);
            }
          }}
        />

        {showDetailQuestions && (
          <div className="conditional-detail-questions">
            {questions.map((question) => (
              <DropdownQuestion
                key={question.field}
                title={question.question}
                options={question.options}
                value={answers[question.field] ?? ""}
                onChange={(value) => setAnswers((current) => ({ ...current, [question.field]: value }))}
              />
            ))}

            <details className="survey-photo-details">
              <summary>사진으로 더 정확하게 분석하기 (선택)</summary>
              <button type="button" className="survey-photo-button" onClick={() => fileRef.current?.click()}>
                {photo ? photo.name : "사진 선택하기"}
              </button>
              <input ref={fileRef} hidden type="file" accept="image/*" onChange={(event) => selectPhoto(event.target.files?.[0] ?? null)} />
            </details>
          </div>
        )}

        {(error || message) && <p className={error ? "api-status error survey-api-status" : "api-status success survey-api-status"}>{error || message}</p>}
        <div className="scroll-spacer" />
      </div>
      <BottomNext
        onClick={() => void next()}
        disabled={missingItems.length > 0 || !allAnswered || loading || loadingQuestions}
        missingItems={loading || loadingQuestions ? [] : missingItems}
      >
        {loading || loadingQuestions ? "처리 중..." : "다음으로 넘어가기"}
      </BottomNext>
    </PinkPage>
  );
}
