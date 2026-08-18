// 온보딩 화면에서 사용하는 선택지와 질문 순서를 한 곳에서 관리합니다.
// 화면 문구를 바꿀 때는 API field 이름은 유지하고 question만 수정하세요.

export const skinTypes = [
  "건성",
  "지성",
  "복합성",
  "민감성",
  "잘 모르겠어요",
] as const;

export const personalColors = [
  "봄 웜",
  "여름 쿨",
  "가을 웜",
  "겨울 쿨",
  "잘 모르겠어요",
] as const;

export const skinConcerns = [
  "트러블",
  "건조함",
  "모공",
  "탄력",
  "칙칙함",
] as const;

export const days = ["월", "화", "수", "목", "금", "토", "일"] as const;

export const workStyles = [
  "일반 근무",
  "야근 많음",
  "교대 근무",
  "학생",
] as const;

export const makeupFrequency = [
  "매일",
  "주 4~6회",
  "주 1~3회",
  "거의 안 함",
] as const;

export const sunscreenFrequency = [
  "매일",
  "자주 바름",
  "가끔 바름",
  "거의 안 바름",
] as const;

export const sweatLevels = [
  "많이 나는 편",
  "보통",
  "적은 편",
] as const;

export const yesNo = ["예", "아니오"] as const;

// 스킨타입 상세 API의 detailAnswers 필드 순서입니다.
export const skinDetailQuestionOrder = [
  "afterWashTightness",
  "tZoneOil",
  "sensitivity",
  "acneFrequency",
] as const;

export const defaultSkinDetailQuestions = [
  {
    field: "afterWashTightness",
    question: "세안 후 피부가 당기나요",
    options: ["예", "아니오"],
  },
  {
    field: "tZoneOil",
    question: "T존이 자주 번들거리나요",
    options: ["예", "아니오"],
  },
  {
    field: "sensitivity",
    question: "피부가 쉽게 붉어지거나 따가운가요",
    options: ["예", "아니오"],
  },
  {
    field: "acneFrequency",
    question: "트러블이 자주 생기나요",
    options: ["예", "아니오"],
  },
] as const;

// 퍼스널컬러 상세 API의 detailAnswers 필드 순서입니다.
export const personalColorDetailQuestionOrder = [
  "veinColor",
  "jewelryColor",
  "lipColor",
  "overallTone",
] as const;

export const defaultPersonalColorDetailQuestions = [
  {
    field: "veinColor",
    question: "손목 혈관 색은 어떤 편인가요",
    options: ["파란빛", "초록빛", "잘 모르겠어요"],
  },
  {
    field: "jewelryColor",
    question: "평소 더 잘 어울리는 악세사리 색은",
    options: ["실버", "골드", "둘 다 잘 어울림", "잘 모르겠어요"],
  },
  {
    field: "lipColor",
    question: "어울리는 립 컬러는 어떤 계열인가요",
    options: ["코랄", "핑크", "오렌지", "버건디", "잘 모르겠어요"],
  },
  {
    field: "overallTone",
    question: "전체적으로 잘 어울리는 톤은",
    options: ["밝고 화사한 편", "깊고 차분한 편", "중간", "잘 모르겠어요"],
  },
] as const;

// AI 피드백을 받고 싶은 루틴 선택 항목입니다.
export const routinePreferenceCharts = [
  { id: "routineCleansing", group: "피부 미용 차트", label: "세안" },
  { id: "routineSkinCare", group: "피부 미용 차트", label: "스킨 케어" },
  { id: "routinePersonalColor", group: "퍼스널 컬러 차트", label: "퍼스널 컬러" },
  { id: "routineSleepWake", group: "루틴 차트", label: "취침 및 기상" },
  { id: "routineDiet", group: "루틴 차트", label: "식습관" },
  { id: "routineExercise", group: "루틴 차트", label: "운동" },
] as const;

export const charts = routinePreferenceCharts;
