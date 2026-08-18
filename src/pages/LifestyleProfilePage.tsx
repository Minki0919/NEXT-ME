import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { BottomNext, Chips, Question, StepHeader } from "../components/FormParts";
import { makeupFrequency, sunscreenFrequency, sweatLevels } from "../data/survey";
import { readSurvey, updateSurvey } from "../utils/storage";
import {
  templateOptions,
  templateQuestionText,
  useOnboardingTemplate,
} from "../hooks/useOnboardingTemplate";

// 질문 순서 8~12는 유지하되 question/options는 백엔드 템플릿을 우선합니다.
export default function LifestyleProfilePage() {
  const navigate = useNavigate();
  const template = useOnboardingTemplate();
  const survey = readSurvey();
  const [sleepHour, setSleepHour] = useState(String(survey.sleepHour ?? ""));
  const [makeup, setMakeup] = useState(String(survey.makeupFrequency ?? ""));
  const [sunscreen, setSunscreen] = useState(String(survey.sunscreenFrequency ?? ""));
  const [exerciseCount, setExerciseCount] = useState(String(survey.exerciseCount ?? ""));
  const [sweat, setSweat] = useState(String(survey.sweatAmount ?? ""));

  const sleepQuestion = templateQuestionText(template, "sleepHour", "평균 수면 시간은 몇 시간인가요");
  const makeupQuestion = templateQuestionText(template, "makeupFrequency", "평소 화장을 주로 하시나요");
  const sunscreenQuestion = templateQuestionText(template, "sunscreenFrequency", "썬크림을 자주 바르시나요");
  const exerciseQuestion = templateQuestionText(template, "exerciseCount", "주에 운동을 몇 번 하시나요");
  const sweatQuestion = templateQuestionText(template, "sweatAmount", "땀이 많이 나시는 편인가요");

  const makeupOptions = templateOptions(template, "makeupFrequency", makeupFrequency);
  const sunscreenOptions = templateOptions(template, "sunscreenFrequency", sunscreenFrequency);
  const sweatOptions = templateOptions(template, "sweatAmount", sweatLevels);
  const missingItems = [
    !sleepHour ? "평균 수면 시간" : "",
    !makeup ? "화장 빈도" : "",
    !sunscreen ? "선크림 사용 빈도" : "",
    exerciseCount === "" ? "주간 운동 횟수" : "",
    !sweat ? "땀 발생 정도" : "",
  ].filter(Boolean);

  function next() {
    updateSurvey({
      sleepHour: Number(sleepHour),
      makeupFrequency: makeup,
      sunscreenFrequency: sunscreen,
      exerciseCount: Number(exerciseCount),
      sweatAmount: sweat,
    });
    navigate("/profile/skin-detail");
  }

  const ready = missingItems.length === 0;

  return (
    <PinkPage className="survey-page">
      <StepHeader step={3} total={3} />
      <div className="survey-scroll lifestyle-scroll">
        <Question title={sleepQuestion}>
          <input
            className="survey-line-input"
            value={sleepHour}
            onChange={(e) => setSleepHour(e.target.value.replace(/[^0-9.]/g, "").slice(0, 4))}
            inputMode="decimal"
            placeholder="숫자 입력"
          />
        </Question>

        <Question title={makeupQuestion}>
          <Chips
            options={makeupOptions}
            value={makeup}
            onChange={(value) => setMakeup(value as string)}
          />
        </Question>

        <Question title={sunscreenQuestion}>
          <Chips
            options={sunscreenOptions}
            value={sunscreen}
            onChange={(value) => setSunscreen(value as string)}
          />
        </Question>

        <Question title={exerciseQuestion}>
          <input
            className="survey-line-input"
            value={exerciseCount}
            onChange={(e) => setExerciseCount(e.target.value.replace(/\D/g, "").slice(0, 2))}
            inputMode="numeric"
            placeholder="숫자 입력"
          />
        </Question>

        <Question title={sweatQuestion}>
          <Chips
            options={sweatOptions}
            value={sweat}
            onChange={(value) => setSweat(value as string)}
          />
        </Question>

        <div className="scroll-spacer" />
      </div>
      <BottomNext onClick={next} disabled={!ready} missingItems={missingItems} />
    </PinkPage>
  );
}
