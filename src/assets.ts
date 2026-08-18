import navBack from "./assets/figma/nav-back.svg";
import navMenu from "./assets/figma/nav-menu.svg";
import gameBottomNav from "./assets/figma/game-bottom-nav.svg";
import loginLogo from "./assets/figma/login-logo.png";
import signupLogo from "./assets/figma/signup-logo.png";
import permissionLogo from "./assets/figma/permission-logo.png";
import permissionPhoto from "./assets/figma/permission-photo.svg";
import permissionLocation from "./assets/figma/permission-location.svg";
import permissionBell from "./assets/figma/permission-bell.svg";
import formChevronDown from "./assets/figma/form-chevron-down.svg";
import uploadVector from "./assets/figma/upload-vector.svg";
import uploadDot from "./assets/figma/upload-dot.svg";
import analysisRingBase from "./assets/figma/analysis-ring-base.svg";
import analysisRingProgress from "./assets/figma/analysis-ring-progress.svg";
import aiRoutineLine from "./assets/figma/ai-routine-line.svg";
import routineTopLine from "./assets/figma/routine-top-line.svg";
import routineCardLine from "./assets/figma/routine-card-line.svg";
import routineCircle from "./assets/figma/routine-circle.svg";
import routineCircleInner from "./assets/figma/routine-circle-inner.svg";
import consultLogo from "./assets/figma/consult-logo.png";
import consultBubble1 from "./assets/figma/consult-bubble-1.svg";
import consultBubble2 from "./assets/figma/consult-bubble-2.svg";
import consultDots from "./assets/figma/consult-dots.svg";
import chatLogo from "./assets/figma/chat-logo.png";
import gameLogo from "./assets/figma/game-logo.png";
import gameEllipse from "./assets/figma/game-ellipse.png";
import gameMakeup from "./assets/figma/game-makeup.svg";
import gameBrush from "./assets/figma/game-brush.svg";

export const assets = {
  // 로그인
  loginLogo,

  // 회원가입
  signupLogo,
  signupMenu: navMenu,

  // 접근 권한
  permissionLogo,
  permissionMenu: navMenu,
  permissionPhoto,
  permissionLocation,
  permissionBell,

  // 최신 프로필 드롭다운
  formChevronDown,

  // 사진 업로드
  uploadVector,
  uploadDot,
  uploadBack: navBack,

  // AI 분석
  analysisRingBase,
  analysisRingProgress,
  analysisBack: navBack,

  // AI 맞춤 루틴
  aiRoutineBack: navBack,
  aiRoutineLine,

  // 오늘의 루틴
  routineMenu: navMenu,
  routineTopLine,
  routineCardLine,
  routineBack: navBack,
  routineCircle,
  routineCircleInner,

  // 상담 시작
  consultLogo,
  consultMenu: navMenu,
  consultBubble1,
  consultBubble2,
  consultDots,

  // 상담
  chatLogo,
  chatMenu: navMenu,
  chatBack: navBack,

  // 게임
  gameLogo,
  gameEllipse,
  gameMenu: navMenu,
  gameNav: gameBottomNav,
  gameMakeup,
  gameBrush,
} as const;
