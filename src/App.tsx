import { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

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

import AppMenu, {
  openAppMenu,
} from "./components/AppMenu";

import ProfileAssistantDialog from "./components/ProfileAssistantDialog";

import { assets } from "./assets";
import { hasValidAuthSession } from "./auth/session";
import {
  getAuthSession,
  getStoredProfile,
} from "./utils/storage";

import aiPopupOuter from "./assets/figma/ai-popup-outer.svg";
import aiPopupInner from "./assets/figma/ai-popup-inner.svg";
import aiPopupSymbol from "./assets/figma/ai-popup-symbol.png";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const loggedIn = hasValidAuthSession();

  const [
    assistantOpen,
    setAssistantOpen,
  ] = useState(false);

  const [
    assistantStarted,
    setAssistantStarted,
  ] = useState(false);

  const [
    assistantButtonPosition,
    setAssistantButtonPosition,
  ] = useState<{
    x: number;
    y: number;
  } | null>(() =>
    readAssistantButtonPosition()
  );

  const assistantDrag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  const assistantButtonWasDragged =
    useRef(false);

  const onboardingPaths = [
    "/profile/basic",
    "/profile/work",
    "/profile/lifestyle",
    "/profile/skin-overview",
    "/profile/skin-detail",
    "/profile/personal-color",
    "/upload",
    "/analysis",
    "/ai-routine",
    "/routine/settings",
    "/routine/create",
  ];

  const publicPaths = [
    "/",
    "/login",
    "/email-login",
    "/signup",
  ];

  const profileCompleted =
    getStoredProfile()?.profileCompleted ===
    true;

  const assistantAvailable =
    loggedIn &&
    profileCompleted &&
    !publicPaths.includes(
      location.pathname
    ) &&
    ![
      "/chat",
      "/consult",
    ].includes(location.pathname) &&
    !onboardingPaths.includes(
      location.pathname
    );

  const nickname =
    getStoredProfile()?.nickname ||
    getAuthSession()?.name ||
    "사용자";

  const pageTitle =
    getPageTitle(location.pathname);

  const showPersistentLogo =
    !publicPaths.includes(
      location.pathname
    );

  const showBackButton =
    !publicPaths.includes(
      location.pathname
    ) &&
    location.pathname !== "/home";

  const showPersistentMenu =
    loggedIn &&
    !publicPaths.includes(
      location.pathname
    );

  const hasPersistentHeader =
    Boolean(pageTitle) &&
    !publicPaths.includes(
      location.pathname
    );

  const pageBackClassName =
    location.pathname ===
    "/routine/adjust"
      ? "persistent-page-back persistent-page-back--routine-adjust"
      : "persistent-page-back";

  useEffect(() => {
    if (!assistantAvailable) {
      setAssistantOpen(false);
      setAssistantStarted(false);
    }
  }, [assistantAvailable]);

  useEffect(() => {
    const keepAssistantButtonOnScreen =
      () => {
        setAssistantButtonPosition(
          (current) => {
            if (!current) {
              return current;
            }

            const button =
              document.querySelector<HTMLButtonElement>(
                ".global-ai-button"
              );

            const next =
              clampAssistantButtonPosition(
                current.x,
                current.y,
                button
              );

            localStorage.setItem(
              "nextme.assistantButtonPosition",
              JSON.stringify(next)
            );

            return next;
          }
        );
      };

    window.addEventListener(
      "resize",
      keepAssistantButtonOnScreen
    );

    window.addEventListener(
      "orientationchange",
      keepAssistantButtonOnScreen
    );

    window.visualViewport?.addEventListener(
      "resize",
      keepAssistantButtonOnScreen
    );

    window.visualViewport?.addEventListener(
      "scroll",
      keepAssistantButtonOnScreen
    );

    keepAssistantButtonOnScreen();

    return () => {
      window.removeEventListener(
        "resize",
        keepAssistantButtonOnScreen
      );

      window.removeEventListener(
        "orientationchange",
        keepAssistantButtonOnScreen
      );

      window.visualViewport?.removeEventListener(
        "resize",
        keepAssistantButtonOnScreen
      );

      window.visualViewport?.removeEventListener(
        "scroll",
        keepAssistantButtonOnScreen
      );
    };
  }, []);

  function goBack() {
    if (
      location.pathname === "/upload"
    ) {
      navigate("/home", {
        replace: true,
      });

      return;
    }

    if (
      location.key !== "default"
    ) {
      navigate(-1);
      return;
    }

    navigate(
      loggedIn ? "/home" : "/",
      {
        replace: true,
      }
    );
  }

  function moveAssistantButton(
    clientX: number,
    clientY: number,
    offsetX: number,
    offsetY: number,
    button: HTMLButtonElement
  ) {
    return clampAssistantButtonPosition(
      clientX - offsetX,
      clientY - offsetY,
      button
    );
  }

  function startAssistantDrag(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    const rect =
      event.currentTarget.getBoundingClientRect();

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    assistantDrag.current = {
      pointerId: event.pointerId,

      startX: event.clientX,
      startY: event.clientY,

      offsetX:
        event.clientX -
        rect.left,

      offsetY:
        event.clientY -
        rect.top,

      moved: false,
    };

    assistantButtonWasDragged.current =
      false;
  }

  function dragAssistantButton(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    const drag =
      assistantDrag.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const next =
      moveAssistantButton(
        event.clientX,
        event.clientY,
        drag.offsetX,
        drag.offsetY,
        event.currentTarget
      );

    if (!drag.moved) {
      drag.moved =
        Math.hypot(
          event.clientX -
            drag.startX,

          event.clientY -
            drag.startY
        ) > 4;
    }

    if (drag.moved) {
      assistantButtonWasDragged.current =
        true;

      setAssistantButtonPosition(
        next
      );
    }
  }

  function finishAssistantDrag(
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    const drag =
      assistantDrag.current;

    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }

    assistantDrag.current = null;

    if (
      assistantButtonWasDragged.current
    ) {
      const finalPosition =
        moveAssistantButton(
          event.clientX,
          event.clientY,
          drag.offsetX,
          drag.offsetY,
          event.currentTarget
        );

      setAssistantButtonPosition(
        finalPosition
      );

      localStorage.setItem(
        "nextme.assistantButtonPosition",
        JSON.stringify(
          finalPosition
        )
      );
    }
  }

  return (
    <div
      className={`next-me-app-shell ${
        hasPersistentHeader
          ? "has-mobile-chrome"
          : ""
      }`}
    >
      {/* 상단 고정 헤더 배경 */}
      {hasPersistentHeader && (
        <div
          className="persistent-mobile-header-bg"
          aria-hidden="true"
        />
      )}

      {/* NEXT : ME 로고 */}
      {showPersistentLogo && (
        <button
          type="button"
          className="persistent-next-me-logo-link"
          aria-label="메인 화면으로 이동"
          onClick={() =>
            navigate(
              loggedIn
                ? "/home"
                : "/"
            )
          }
        >
          <img
            className="persistent-next-me-logo"
            src={
              assets.signupLogo
            }
            alt="Next : Me"
          />
        </button>
      )}

      {/* 뒤로가기 */}
      {showBackButton && (
        <button
          type="button"
          className={
            pageBackClassName
          }
          aria-label="이전 페이지로 돌아가기"
          onClick={goBack}
        >
          <img
            src={
              assets.routineBack
            }
            alt=""
          />
        </button>
      )}

      {/* 페이지 제목 */}
      {hasPersistentHeader && (
        <h1 className="persistent-mobile-page-title">
          {pageTitle}
        </h1>
      )}

      {/* 메뉴 버튼 */}
      {showPersistentMenu && (
        <button
          type="button"
          className="persistent-app-menu-button"
          aria-label="전체 메뉴 열기"
          onClick={openAppMenu}
        >
          <img
            src={
              assets.routineMenu
            }
            alt=""
          />
        </button>
      )}

      {loggedIn && <AppMenu />}

      {/* AI 플로팅 버튼 */}
      {assistantAvailable &&
        !assistantOpen && (
          <button
            type="button"
            className="global-ai-button"
            style={
              assistantButtonPosition
                ? {
                    left:
                      assistantButtonPosition.x,

                    top:
                      assistantButtonPosition.y,

                    right:
                      "auto",

                    bottom:
                      "auto",
                  }
                : undefined
            }
            onPointerDown={
              startAssistantDrag
            }
            onPointerMove={
              dragAssistantButton
            }
            onPointerUp={
              finishAssistantDrag
            }
            onPointerCancel={
              finishAssistantDrag
            }
            onClick={() => {
              if (
                assistantButtonWasDragged.current
              ) {
                assistantButtonWasDragged.current =
                  false;

                return;
              }

              setAssistantStarted(
                true
              );

              setAssistantOpen(
                true
              );
            }}
            aria-label="AI 기본 대화 열기"
          >
            <img
              className="global-ai-logo-outer"
              src={aiPopupOuter}
              alt=""
            />

            <img
              className="global-ai-logo-inner"
              src={aiPopupInner}
              alt=""
            />

            <span
              className="global-ai-logo-symbol"
              aria-hidden="true"
            >
              <img
                src={
                  aiPopupSymbol
                }
                alt=""
              />
            </span>
          </button>
        )}

      {/* AI 대화창 */}
      {assistantAvailable &&
        assistantStarted && (
          <ProfileAssistantDialog
            open={
              assistantOpen
            }
            nickname={
              nickname
            }
            onMinimize={() =>
              setAssistantOpen(
                false
              )
            }
            onClose={() => {
              setAssistantStarted(
                false
              );

              setAssistantOpen(
                false
              );
            }}
          />
        )}

      <Routes>
        <Route
          path="/"
          element={<StartPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/email-login"
          element={<EmailLoginPage />}
        />

        <Route
          path="/signup"
          element={<SignUpPage />}
        />

        <Route
          element={
            <ProtectedRoute />
          }
        >
          <Route
            path="/permissions"
            element={
              <PermissionPage />
            }
          />

          <Route
            path="/profile/basic"
            element={
              <BasicProfilePage />
            }
          />

          <Route
            path="/profile/work"
            element={
              <WorkProfilePage />
            }
          />

          <Route
            path="/profile/lifestyle"
            element={
              <LifestyleProfilePage />
            }
          />

          <Route
            path="/profile/skin-overview"
            element={
              <SkinOverviewPage />
            }
          />

          <Route
            path="/profile/skin-detail"
            element={
              <SkinDetailPage />
            }
          />

          <Route
            path="/profile/personal-color"
            element={
              <PersonalColorDetailPage />
            }
          />

          <Route
            path="/upload"
            element={
              <UploadPage />
            }
          />

          <Route
            path="/analysis"
            element={
              <AnalysisPage />
            }
          />

          <Route
            path="/ai-routine"
            element={
              <AiRoutinePage />
            }
          />

          <Route
            path="/routine"
            element={
              <RoutinePage />
            }
          />

          <Route
            path="/routine/settings"
            element={
              <RoutineSettingsPage />
            }
          />

          <Route
            path="/routine/create"
            element={
              <RoutineCreatePage />
            }
          />

          <Route
            path="/routine/complete"
            element={
              <RoutineCompletePage />
            }
          />

          <Route
            path="/routine/adjust"
            element={
              <RoutineAdjustPage />
            }
          />

          <Route
            path="/routine/history"
            element={
              <RoutineHistoryPage />
            }
          />

          <Route
            path="/consult"
            element={
              <ConsultStartPage />
            }
          />

          <Route
            path="/chat"
            element={
              <ChatPage />
            }
          />

          <Route
            path="/game"
            element={
              <GamePage />
            }
          />

          <Route
            path="/home"
            element={
              <HomePage />
            }
          />

          <Route
            path="/profile"
            element={
              <ProfileOverviewPage />
            }
          />

          <Route
            path="/personal-color"
            element={
              <PersonalColorSummaryPage />
            }
          />

          <Route
            path="/characters"
            element={
              <CharacterCollectionPage />
            }
          />

          <Route
            path="/pets"
            element={
              <PetCatalogPage />
            }
          />

          <Route
            path="/user-care"
            element={
              <UserCarePage />
            }
          />

          <Route
            path="/personal-color/outfit"
            element={
              <OutfitRecommendationPage />
            }
          />

          <Route
            path="/personal-color/makeup"
            element={
              <MakeupRecommendationPage />
            }
          />

          <Route
            path="/personal-color/history"
            element={
              <RecommendationHistoryPage />
            }
          />

          <Route
            path="/charts/select"
            element={
              <ChartSelectPage />
            }
          />

          <Route
            path="/charts"
            element={
              <ChartHubPage />
            }
          />

          <Route
            path="/charts/:chartId"
            element={
              <ChartDetailPage />
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </div>
  );
}

function getPageTitle(
  pathname: string
) {
  const titles: Record<
    string,
    string
  > = {
    "/permissions":
      "접근 권한 안내",

    "/profile/basic":
      "맞춤 프로필 작성",

    "/profile/work":
      "맞춤 프로필 작성",

    "/profile/lifestyle":
      "맞춤 프로필 작성",

    "/profile/skin-overview":
      "스킨 타입 진단",

    "/profile/skin-detail":
      "스킨 타입 진단",

    "/profile/personal-color":
      "퍼스널 컬러 진단",

    "/upload":
      "사진 업로드",

    "/analysis":
      "AI 분석 결과",

    "/ai-routine":
      "AI 맞춤 루틴",

    "/routine":
      "오늘의 루틴",

    "/routine/settings":
      "루틴 설정",

    "/routine/create":
      "루틴 만들기",

    "/routine/complete":
      "루틴 완료하기",

    "/routine/adjust":
      "루틴 수정하기",

    "/routine/history":
      "루틴 완료 조회",

    "/consult":
      "AI 맞춤 상담",

    "/chat":
      "AI 맞춤 상담",

    "/game":
      "캐릭터",

    "/home":
      "메인",

    "/profile":
      "프로필 확인·수정",

    "/personal-color":
      "퍼스널 컬러 확인",

    "/characters":
      "캐릭터 수집 현황",

    "/pets":
      "캐릭터 도감",

    "/user-care":
      "피부 관리 가이드",

    "/personal-color/outfit":
      "옷 추천 받기",

    "/personal-color/makeup":
      "화장 추천 받기",

    "/personal-color/history":
      "추천 이력 보기",

    "/charts/select":
      "루틴 설정",

    "/charts":
      "루틴 차트",
  };

  if (
    pathname.startsWith(
      "/charts/"
    )
  ) {
    return "루틴 차트 상세";
  }

  return titles[pathname] ?? "";
}

function readAssistantButtonPosition() {
  try {
    const value = JSON.parse(
      localStorage.getItem(
        "nextme.assistantButtonPosition"
      ) || "null"
    ) as {
      x?: unknown;
      y?: unknown;
    } | null;

    if (
      value &&
      typeof value.x ===
        "number" &&
      typeof value.y ===
        "number"
    ) {
      return {
        x: value.x,
        y: value.y,
      };
    }
  } catch {
    // 잘못 저장된 위치는 무시
  }

  return null;
}

function clampAssistantButtonPosition(
  x: number,
  y: number,
  button?: HTMLButtonElement | null
) {
  const viewport =
    window.visualViewport;

  const viewportWidth =
    viewport?.width ??
    document.documentElement
      .clientWidth ??
    window.innerWidth;

  const viewportHeight =
    viewport?.height ??
    document.documentElement
      .clientHeight ??
    window.innerHeight;

  const rect =
    button?.getBoundingClientRect();

  const buttonWidth =
    rect?.width ||
    (window.innerWidth <= 360
      ? 62
      : 70);

  const buttonHeight =
    rect?.height ||
    (window.innerWidth <= 360
      ? 62
      : 70);

  const edge = 12;

  const hasFixedHeader =
    document
      .querySelector(
        ".next-me-app-shell"
      )
      ?.classList.contains(
        "has-mobile-chrome"
      ) &&
    window.innerWidth <= 600;

  const minY =
    hasFixedHeader
      ? 120
      : edge;

  const maxX = Math.max(
    edge,
    viewportWidth -
      buttonWidth -
      edge
  );

  const maxY = Math.max(
    minY,
    viewportHeight -
      buttonHeight -
      edge
  );

  return {
    x: Math.min(
      maxX,
      Math.max(
        edge,
        x
      )
    ),

    y: Math.min(
      maxY,
      Math.max(
        minY,
        y
      )
    ),
  };
}