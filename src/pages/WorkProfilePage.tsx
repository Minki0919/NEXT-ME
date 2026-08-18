import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { BottomNext, Chips, Question, StepHeader } from "../components/FormParts";
import { days, workStyles } from "../data/survey";
import { readSurvey, updateSurvey } from "../utils/storage";
import {
  templateOptions,
  templateQuestionText,
  useOnboardingTemplate,
} from "../hooks/useOnboardingTemplate";

// 최신 Figma 94:161의 순서: 근무요일 -> 출근 -> 퇴근 -> 근무스타일.
export default function WorkProfilePage() {
  const navigate = useNavigate();
  const template = useOnboardingTemplate();
  const survey = readSurvey();
  const [workDays, setWorkDays] = useState<string[]>(Array.isArray(survey.workDay) ? (survey.workDay as string[]) : []);
  const [workStyle, setWorkStyle] = useState(String(survey.workStyle ?? ""));
  const [comeTime, setComeTime] = useState(String(survey.comeTime ?? survey.startTime ?? ""));
  const [leaveTime, setLeaveTime] = useState(String(survey.leaveTime ?? survey.endTime ?? ""));

  const workDayQuestion = templateQuestionText(template, "workDay", "주로 일을 하는 요일은 어떻게 되시나요?");
  const workDayOptions = templateOptions(template, "workDay", days);
  const comeTimeQuestion = templateQuestionText(
    template,
    "comeTime",
    "24시간 기준 주된 출가 시간을 입력해주세요."
  );
  const leaveTimeQuestion = templateQuestionText(
    template,
    "leaveTime",
    "24시간 기준 주된 귀가 시간을 입력해주세요."
  );
  const workStyleQuestion = templateQuestionText(template, "workStyle", "근무 스타일을 선택해 주세요");
  const workStyleOptions = templateOptions(template, "workStyle", workStyles);
  const missingItems = [
    workDays.length === 0 ? "근무 요일" : "",
    !comeTime ? "출근 시간" : "",
    !leaveTime ? "퇴근 시간" : "",
    !workStyle ? "근무 스타일" : "",
  ].filter(Boolean);

  function next() {
    updateSurvey({ workDay: workDays, workStyle, comeTime, leaveTime });
    navigate("/profile/lifestyle");
  }

  const ready = missingItems.length === 0;

  return (
    <PinkPage className="survey-page">
      <StepHeader step={2} total={3} />
      <div className="survey-scroll work-profile-scroll">
        <p className="profile-greeting work-intro">
          <strong>Next : Me를</strong> 시작하기 위한 정보를 입력해주세요
          <br />
          나에게 맞는 서비스를 위해 기본 정보를 알려주세요.
        </p>

        <Question title={workDayQuestion}>
          <Chips options={workDayOptions} value={workDays} multiple onChange={(value) => setWorkDays(value as string[])} />
        </Question>

        <Question title={comeTimeQuestion}>
          <input className="survey-line-input" value={comeTime} type="time" onChange={(e) => setComeTime(e.target.value)} />
        </Question>

        <Question title={leaveTimeQuestion}>
          <input className="survey-line-input" value={leaveTime} type="time" onChange={(e) => setLeaveTime(e.target.value)} />
        </Question>

        <Question title={workStyleQuestion}>
          <Chips options={workStyleOptions} value={workStyle} onChange={(value) => setWorkStyle(value as string)} />
        </Question>
        <div className="scroll-spacer" />
      </div>
      <BottomNext onClick={next} disabled={!ready} missingItems={missingItems} />
    </PinkPage>
  );
}
