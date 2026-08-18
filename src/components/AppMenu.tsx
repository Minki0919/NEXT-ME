import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTodayRoutineProgress } from "../api/routines";
import { assets } from "../assets";
import menuCharacterIcon from "../assets/figma/menu-character.svg";
import menuChevronIcon from "../assets/figma/menu-chevron.svg";
import menuHomeIcon from "../assets/figma/menu-home.svg";
import menuLogoutIcon from "../assets/figma/menu-logout.svg";
import menuPaletteIcon from "../assets/figma/menu-palette.svg";
import menuRoutineIcon from "../assets/figma/menu-routine.svg";
import menuUserIcon from "../assets/figma/menu-user.svg";
import { clearNextMeLocalData, getAuthSession, getStoredProfile } from "../utils/storage";

export const OPEN_APP_MENU_EVENT = "next-me:open-app-menu";

export function openAppMenu() {
  window.dispatchEvent(new Event(OPEN_APP_MENU_EVENT));
}

type MenuGroup = "routine" | "character" | "personalColor";

export default function AppMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<MenuGroup | null>(null);
  const [progress, setProgress] = useState(0);
  const nickname = getStoredProfile()?.nickname || getAuthSession()?.name || "사용자";

  useEffect(() => {
    const show = () => {
      if (location.pathname.startsWith("/routine") || location.pathname === "/user-care") {
        setExpanded("routine");
      } else if (location.pathname.startsWith("/personal-color")) {
        setExpanded("personalColor");
      } else if (location.pathname === "/pets" || location.pathname === "/characters") {
        setExpanded("character");
      } else {
        setExpanded(null);
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_APP_MENU_EVENT, show);
    return () => window.removeEventListener(OPEN_APP_MENU_EVENT, show);
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    let cancelled = false;
    void getTodayRoutineProgress()
      .then((result) => {
        if (!cancelled) setProgress(normalizePercentage(result.completionPercentage));
      })
      .catch(() => {
        if (!cancelled) setProgress(0);
      });

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  function toggle(group: MenuGroup) {
    setExpanded((current) => current === group ? null : group);
  }

  function logout() {
    if (!window.confirm("로그아웃할까요?")) return;
    clearNextMeLocalData();
    setOpen(false);
    navigate("/", { replace: true });
  }

  if (!open) return null;

  return (
    <div className="app-menu-overlay" role="presentation" onClick={() => setOpen(false)}>
      <aside
        className="app-menu-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="전체 메뉴"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="app-menu-profile">
          <img src={assets.signupLogo} alt="Next : Me" />
          <div>
            <strong>{nickname}님</strong>
            <span>오늘의 진행도 {progress}%</span>
            <div
              className="app-menu-progress"
              role="progressbar"
              aria-label="오늘의 루틴 진행도"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        <nav className="app-menu-list" aria-label="서비스 메뉴">
          <button type="button" className="app-menu-row" onClick={() => go("/home")}>
            <img src={menuHomeIcon} alt="" /><span>메인</span>
          </button>

          <button type="button" className="app-menu-row" onClick={() => go("/profile")}>
            <img src={menuUserIcon} alt="" /><span>프로필</span>
          </button>

          <MenuGroupButton
            icon={menuRoutineIcon}
            label="루틴"
            open={expanded === "routine"}
            onClick={() => toggle("routine")}
          />
          {expanded === "routine" && (
            <div className="app-menu-submenu">
              <button type="button" onClick={() => go("/routine/settings")}>루틴 설정</button>
              <button type="button" onClick={() => go("/routine/create")}>루틴 만들기</button>
              <button type="button" onClick={() => go("/user-care")}>피부 관리 가이드</button>
              <button type="button" onClick={() => go("/routine/complete")}>루틴 완료하기</button>
              <button type="button" onClick={() => go("/routine/adjust")}>루틴 수정하기</button>
              <button type="button" onClick={() => go("/routine/history")}>루틴 완료 조회</button>
            </div>
          )}

          <MenuGroupButton
            icon={menuPaletteIcon}
            label="퍼스널 컬러"
            open={expanded === "personalColor"}
            onClick={() => toggle("personalColor")}
          />
          {expanded === "personalColor" && (
            <div className="app-menu-submenu">
              <button type="button" onClick={() => go("/personal-color")}>퍼스널 컬러 확인</button>
              <button type="button" onClick={() => go("/personal-color/outfit")}>옷 추천 받기</button>
              <button type="button" onClick={() => go("/personal-color/makeup")}>화장 추천 받기</button>
              <button type="button" onClick={() => go("/personal-color/history")}>추천 이력 보기</button>
            </div>
          )}

          <MenuGroupButton
            icon={menuCharacterIcon}
            label="캐릭터"
            open={expanded === "character"}
            onClick={() => toggle("character")}
          />
          {expanded === "character" && (
            <div className="app-menu-submenu">
              <button type="button" onClick={() => go("/characters")}>캐릭터 수집 현황</button>
              <button type="button" onClick={() => go("/pets")}>캐릭터 도감</button>
            </div>
          )}

          <button type="button" className="app-menu-row" onClick={logout}>
            <img src={menuLogoutIcon} alt="" /><span>로그아웃</span>
          </button>
        </nav>
      </aside>
    </div>
  );
}

function MenuGroupButton({
  icon,
  label,
  open,
  onClick,
}: {
  icon: string;
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`app-menu-row ${open ? "active" : ""}`}
      aria-expanded={open}
      onClick={onClick}
    >
      <img src={icon} alt="" />
      <span>{label}</span>
      <img className={`app-menu-chevron ${open ? "open" : ""}`} src={menuChevronIcon} alt="" />
    </button>
  );
}

function normalizePercentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}
