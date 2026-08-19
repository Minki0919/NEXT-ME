import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import StartPage from "./pages/StartPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import EmailLoginPage from "./pages/EmailLoginPage";
import PermissionPage from "./pages/PermissionPage";
import BasicProfilePage from "./pages/BasicProfilePage";
import SkinOverviewPage from "./pages/SkinOverviewPage";
import WorkProfilePage from "./pages/WorkProfilePage";
import LifestyleProfilePage from "./pages/LifestyleProfilePage";
import SkinDetailPage from "./pages/SkinDetailPage";
import PersonalColorDetailPage from "./pages/PersonalColorDetailPage";
import UploadPage from "./pages/UploadPage";
import AnalysisPage from "./pages/AnalysisPage";
import AiRoutinePage from "./pages/AiRoutinePage";
import RoutinePage from "./pages/RoutinePage";
import ConsultStartPage from "./pages/ConsultStartPage";
import ChatPage from "./pages/ChatPage";
import GamePage from "./pages/GamePage";
import ChartSelectPage from "./pages/ChartSelectPage";
import ChartHubPage from "./pages/ChartHubPage";
import ChartDetailPage from "./pages/ChartDetailPage";
import HomePage from "./pages/HomePage";
import ProfileOverviewPage from "./pages/ProfileOverviewPage";
import PersonalColorSummaryPage from "./pages/PersonalColorSummaryPage";
import CharacterCollectionPage from "./pages/CharacterCollectionPage";
import PetCatalogPage from "./pages/PetCatalogPage";
import UserCarePage from "./pages/UserCarePage";
import RoutineSettingsPage from "./pages/RoutineSettingsPage";
import RoutineCreatePage from "./pages/RoutineCreatePage";
import RoutineCompletePage from "./pages/RoutineCompletePage";
import RoutineAdjustPage from "./pages/RoutineAdjustPage";
import RoutineHistoryPage from "./pages/RoutineHistoryPage";
import {
  MakeupRecommendationPage,
  OutfitRecommendationPage,
  RecommendationHistoryPage,
} from "./pages/PersonalColorRecommendationPages";
import AppMenu, { openAppMenu } from "./components/AppMenu";
import { assets } from "./assets";
import { hasValidAuthSession } from "./auth/session";
import ProfileAssistantDialog from "./components/ProfileAssistantDialog";
import { getAuthSession, getStoredProfile } from "./utils/storage";
import aiPopupOuter from "./assets/figma/ai-popup-outer.svg";
import aiPopupInner from "./assets/figma/ai-popup-inner.svg";
import aiPopupSymbol from "./assets/figma/ai-popup-symbol.png";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = hasValidAuthSession();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantStarted, setAssistantStarted] = useState(false);
  const onboardingPaths = [
    "/profile/basic", "/profile/work", "/profile/lifestyle", "/profile/skin-overview",
    "/profile/skin-detail", "/profile/personal-color", "/upload", "/analysis", "/ai-routine",
    "/routine/settings", "/routine/create",
  ];
  const profileCompleted = getStoredProfile()?.profileCompleted === true;
  const publicPaths = ["/", "/login", "/email-login", "/signup"];
  const assistantAvailable = loggedIn && profileCompleted && !publicPaths.includes(location.pathname) && !["/chat", "/consult"].includes(location.pathname) && !onboardingPaths.includes(location.pathname);
  const nickname = getStoredProfile()?.nickname || getAuthSession()?.name || "사용자";

  useEffect(() => {
    if (!assistantAvailable) {
      setAssistantOpen(false);
      setAssistantStarted(false);
    }
  }, [assistantAvailable]);
  const showPersistentLogo = !publicPaths.includes(location.pathname) && location.pathname !== "/profile";
  const usesPageBackButton = [
    "/email-login",
    "/upload",
    "/analysis",
    "/ai-routine",
    "/routine",
    "/chat",
  ].includes(location.pathname);
  const showBackButton =
    !publicPaths.includes(location.pathname) &&
    !usesPageBackButton;
  const usesPageMenuButton = [
    "/consult",
    "/chat",
    "/game",
    "/routine",
    "/routine/settings",
    "/routine/create",
    "/routine/adjust",
    "/user-care",
    "/profile",
  ].includes(location.pathname) || location.pathname.startsWith("/personal-color/");
  const showPersistentMenu =
    loggedIn && !publicPaths.includes(location.pathname) && !usesPageMenuButton;
  const pageBackClassName = location.pathname === "/routine/adjust"
    ? "persistent-page-back persistent-page-back--routine-adjust"
    : "persistent-page-back";

  function goBack() {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate(loggedIn ? "/home" : "/", { replace: true });
  }

  return (
    <div className="next-me-app-shell">
      {/*
        NEXT : ME 고정 아이콘
        - Routes 바깥에 두어 페이지가 바뀌어도 항상 유지됩니다.
        - 각 페이지가 내부 스크롤되어도 아이콘은 화면 상단에 남아 있습니다.
      */}
      {showPersistentLogo && (
        <button
          type="button"
          className="persistent-next-me-logo-link"
          aria-label={loggedIn ? "게임 홈으로 이동" : "시작 화면으로 이동"}
          onClick={() => navigate(loggedIn ? "/home" : "/")}
        >
          <img
            className="persistent-next-me-logo"
            src={assets.signupLogo}
            alt="Next : Me"
          />
        </button>
      )}

      {showBackButton && (
        <button
          type="button"
          className={pageBackClassName}
          aria-label="이전 페이지로 돌아가기"
          onClick={goBack}
        >
          <img src={assets.routineBack} alt="" />
        </button>
      )}

      {showPersistentMenu && (
        <button
          type="button"
          className="persistent-app-menu-button"
          aria-label="전체 메뉴 열기"
          onClick={openAppMenu}
        >
          <img src={assets.routineMenu} alt="" />
        </button>
      )}

      {loggedIn && <AppMenu />}

      {assistantAvailable && !assistantOpen && (
        <button type="button" className="global-ai-button" onClick={() => { setAssistantStarted(true); setAssistantOpen(true); }} aria-label="AI 기본 대화 열기">
          <img className="global-ai-logo-outer" src={aiPopupOuter} alt="" />
          <img className="global-ai-logo-inner" src={aiPopupInner} alt="" />
          <span className="global-ai-logo-symbol" aria-hidden="true"><img src={aiPopupSymbol} alt="" /></span>
        </button>
      )}
      {assistantAvailable && assistantStarted && (
        <ProfileAssistantDialog
          open={assistantOpen}
          nickname={nickname}
          onMinimize={() => setAssistantOpen(false)}
          onClose={() => { setAssistantStarted(false); setAssistantOpen(false); }}
        />
      )}

      <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/email-login" element={<EmailLoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/permissions" element={<PermissionPage />} />

        <Route path="/profile/basic" element={<BasicProfilePage />} />
        <Route path="/profile/work" element={<WorkProfilePage />} />
        <Route path="/profile/lifestyle" element={<LifestyleProfilePage />} />
        <Route path="/profile/skin-overview" element={<SkinOverviewPage />} />
        <Route path="/profile/skin-detail" element={<SkinDetailPage />} />
        <Route path="/profile/personal-color" element={<PersonalColorDetailPage />} />

        <Route path="/upload" element={<UploadPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/ai-routine" element={<AiRoutinePage />} />
        <Route path="/routine" element={<RoutinePage />} />
        <Route path="/routine/settings" element={<RoutineSettingsPage />} />
        <Route path="/routine/create" element={<RoutineCreatePage />} />
        <Route path="/routine/complete" element={<RoutineCompletePage />} />
        <Route path="/routine/adjust" element={<RoutineAdjustPage />} />
        <Route path="/routine/history" element={<RoutineHistoryPage />} />
        <Route path="/consult" element={<ConsultStartPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfileOverviewPage />} />
        <Route path="/personal-color" element={<PersonalColorSummaryPage />} />
        <Route path="/characters" element={<CharacterCollectionPage />} />
        <Route path="/pets" element={<PetCatalogPage />} />
        <Route path="/user-care" element={<UserCarePage />} />
        <Route path="/personal-color/outfit" element={<OutfitRecommendationPage />} />
        <Route path="/personal-color/makeup" element={<MakeupRecommendationPage />} />
        <Route path="/personal-color/history" element={<RecommendationHistoryPage />} />

        <Route path="/charts/select" element={<ChartSelectPage />} />
        <Route path="/charts" element={<ChartHubPage />} />
        <Route path="/charts/:chartId" element={<ChartDetailPage />} />
      </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
