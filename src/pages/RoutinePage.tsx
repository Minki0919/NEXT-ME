import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { openAppMenu } from "../components/AppMenu";
import { assets } from "../assets";
import { ApiError } from "../api/http";
import { getMyCharacterCollection } from "../api/characters";
import {
  generateTodayRoutine,
  getTodayRoutine,
  setRoutineItemCompleted,
} from "../api/routines";
import type {
  CharacterReward,
  RoutineItem,
  RoutinePlan,
} from "../api/types";
import { getPetVisual } from "../data/pets";

const ROUTINE_GUIDE_EXPANDED_TOP = 36;
const ROUTINE_GUIDE_COLLAPSED_TOP = 60;

export default function RoutinePage() {
  const navigate = useNavigate();
  const guideDragStartY = useRef(0);
  const guideDragStartTop = useRef(ROUTINE_GUIDE_COLLAPSED_TOP);
  const guideMoved = useRef(false);
  const [routine, setRoutine] = useState<RoutinePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [petReward, setPetReward] = useState<CharacterReward | null>(null);
  const [refreshingPets, setRefreshingPets] = useState(false);
  const [guideTop, setGuideTop] = useState(ROUTINE_GUIDE_COLLAPSED_TOP);
  const [guideDragging, setGuideDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRoutine() {
      try {
        const result = await getTodayRoutine();
        if (!cancelled) {
          setRoutine(result);
          setError("");
        }
      } catch (value) {
        if (!cancelled) {
          setError(value instanceof Error ? value.message : "오늘의 루틴을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRoutine();
    const refreshTimer = window.setInterval(() => void loadRoutine(), 60_000);
    const refreshOnFocus = () => void loadRoutine();
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  async function createRoutine() {
    if (loading) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const result = await generateTodayRoutine();
      setRoutine(result);
      setNotice("백엔드에서 오늘의 맞춤 루틴을 만들었어요.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "루틴을 생성하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(itemId: number, completed: boolean) {
    if (loadingItemId !== null) return;
    setLoadingItemId(itemId);
    setError("");
    setNotice("");
    try {
      // PATCH 응답에 최신 완료율이 포함된 전체 루틴이 반환됩니다.
      const updated = await setRoutineItemCompleted(itemId, !completed);
      setRoutine(updated);

      const reward = updated.characterReward;
      if (
        reward?.newCharacterCollected === true &&
        reward.alreadyProcessed === false &&
        reward.characterNumber !== null
      ) {
        setPetReward(reward);
      } else if (reward?.allCharactersCollected && !reward.alreadyProcessed) {
        setNotice(reward.message || "모든 펫을 수집했어요!");
      }
    } catch (value) {
      setError(
        value instanceof ApiError && value.status === 502
          ? "펫 보상을 처리하지 못했습니다. 잠시 후 다시 완료를 시도해 주세요."
          : value instanceof Error
            ? value.message
            : "루틴 완료 상태를 변경하지 못했습니다."
      );
    } finally {
      setLoadingItemId(null);
    }
  }

  async function closePetReward() {
    if (refreshingPets) return;
    setRefreshingPets(true);
    try {
      const collection = await getMyCharacterCollection();
      setNotice(`현재 펫 ${collection.ownedCount}/${collection.totalCharacterCount}마리를 보유하고 있어요.`);
    } catch (value) {
      setNotice(value instanceof Error ? value.message : "최신 펫 보유 현황은 도감에서 다시 확인해 주세요.");
    } finally {
      setPetReward(null);
      setRefreshingPets(false);
    }
  }

  function selectRoutineItem(item: RoutineItem) {
    if (loadingItemId !== null) return;

    setError("");
    if (item.expired) {
      setNotice(
        `‘${item.title}’ 루틴은 ${formatRoutineTime(item.deadlineAt)}에 마감되었어요.`
      );
      return;
    }
    if (!item.editable) {
      setNotice(
        `‘${item.title}’ 루틴은 ${formatRoutineTime(item.availableAt)}부터 ${formatRoutineTime(item.deadlineAt)}까지 완료할 수 있어요.`
      );
      return;
    }

    setNotice("");
    void toggle(item.id, item.completed);
  }

  function clampGuideTop(value: number) {
    return Math.min(
      ROUTINE_GUIDE_COLLAPSED_TOP,
      Math.max(ROUTINE_GUIDE_EXPANDED_TOP, value)
    );
  }

  function startGuideDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    guideDragStartY.current = event.clientY;
    guideDragStartTop.current = guideTop;
    guideMoved.current = false;
    setGuideDragging(true);
  }

  function moveGuide(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!guideDragging) return;

    const page = event.currentTarget.closest(".today-routine-page");
    const pageHeight = page?.getBoundingClientRect().height ?? 0;
    if (!pageHeight) return;

    const delta = ((event.clientY - guideDragStartY.current) / pageHeight) * 100;
    if (Math.abs(delta) > 1) guideMoved.current = true;
    setGuideTop(clampGuideTop(guideDragStartTop.current + delta));
  }

  function endGuideDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!guideDragging) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setGuideDragging(false);

    const middle = (ROUTINE_GUIDE_EXPANDED_TOP + ROUTINE_GUIDE_COLLAPSED_TOP) / 2;
    setGuideTop((current) =>
      current <= middle ? ROUTINE_GUIDE_EXPANDED_TOP : ROUTINE_GUIDE_COLLAPSED_TOP
    );
  }

  function toggleGuide() {
    if (guideMoved.current) {
      guideMoved.current = false;
      return;
    }

    setGuideTop((current) =>
      current === ROUTINE_GUIDE_EXPANDED_TOP
        ? ROUTINE_GUIDE_COLLAPSED_TOP
        : ROUTINE_GUIDE_EXPANDED_TOP
    );
  }

  const progress = routine?.completionPercentage ?? 0;
  const routineItems = routine?.items ?? [];
  const rewardedPet = petReward?.characterNumber !== null && petReward?.characterNumber !== undefined
    ? getPetVisual(petReward.characterNumber)
    : null;

  return (
    <PinkPage className="today-routine-page">
      <button className="routine-back" onClick={() => navigate("/ai-routine")}>
        <img src={assets.routineBack} alt="뒤로가기" />
      </button>
      <button
        type="button"
        className="routine-menu-button"
        aria-label="전체 메뉴 열기"
        onClick={openAppMenu}
      >
        <img className="routine-menu-icon" src={assets.routineMenu} alt="" />
      </button>

      <h1>오늘의 루틴</h1>

      <section className="routine-progress-section">
        <h2>진행률</h2>
        <div className="routine-progress-row">
          <div className="routine-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <strong>{progress}%</strong>
        </div>
        <p>
          {routine?.coachMessage || (loading ? "오늘의 루틴을 불러오는 중이에요." : "아직 생성된 루틴이 없어요.")}
          <br />
          {routine?.allCompleted ? "오늘의 루틴을 모두 완료했어요!" : "서버가 안내한 시간 안에 하나씩 완료해 보세요."}
        </p>
        <img className="routine-top-line" src={assets.routineTopLine} alt="" />
      </section>

      <section className="routine-check-list">
        {routineItems.map((item) => (
          <div className="routine-check-item" key={item.id}>
            <button
              type="button"
              className="routine-complete-toggle"
              disabled={loadingItemId !== null}
              aria-disabled={!item.editable || item.expired}
              onClick={() => selectRoutineItem(item)}
              title={item.description}
            >
              <span className={`routine-dot ${item.completed ? "checked" : ""}`} />
              <span className="routine-item-copy">
                <strong>{item.title}</strong>
                <small>{getRoutineItemStatus(item)}</small>
              </span>
            </button>
            <div
              className="routine-time-field"
              aria-label={`${item.title} 루틴 시간 ${formatRoutineTime(item.scheduledTime)}, 마감 시간 ${formatRoutineTime(item.deadlineAt)}`}
            >
              <span>실행 <time dateTime={item.scheduledTime}>{toTimeInputValue(item.scheduledTime)}</time></span>
              <i aria-hidden="true">|</i>
              <strong>마감 <time dateTime={item.deadlineAt}>{toTimeInputValue(item.deadlineAt)}</time></strong>
            </div>
          </div>
        ))}
        {!loading && routineItems.length === 0 && <p>루틴 만들기를 눌러 오늘 계획을 생성해 주세요.</p>}
      </section>

      <section
        className={`tomorrow-card ${guideDragging ? "dragging" : ""}`}
        style={{ top: `${guideTop}%` }}
      >
        <button
          type="button"
          className="routine-guide-grabber"
          aria-label={
            guideTop === ROUTINE_GUIDE_EXPANDED_TOP
              ? "오늘의 루틴 안내 접기"
              : "오늘의 루틴 안내 펼치기"
          }
          aria-expanded={guideTop === ROUTINE_GUIDE_EXPANDED_TOP}
          onClick={toggleGuide}
          onPointerDown={startGuideDrag}
          onPointerMove={moveGuide}
          onPointerUp={endGuideDrag}
          onPointerCancel={endGuideDrag}
        >
          <span />
        </button>
        <div className="routine-guide-content">
          <h3>내일 아침에 할 일</h3>
          <img src={assets.routineCardLine} alt="" />
          <ul>
            {routineItems.map((item) => (
              <li key={item.id}>
                루틴 {formatRoutineTime(item.scheduledTime)} · 마감 {formatRoutineTime(item.deadlineAt)}
                <br />
                {item.description}
              </li>
            ))}
            {routineItems.length === 0 && <li>선택한 루틴 종류를 기준으로 맞춤 계획을 만들 수 있어요.</li>}
          </ul>
        </div>
      </section>

      {petReward && rewardedPet && (
        <div className="pet-reward-overlay" role="presentation">
          <section
            className="pet-reward-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pet-reward-title"
          >
            <span className="pet-reward-sparkle" aria-hidden="true">✦</span>
            <p className="pet-reward-kicker">새로운 펫을 만났어요!</p>
            <img
              src={rewardedPet.image}
              alt={`${rewardedPet.name} 펫`}
            />
            <h2 id="pet-reward-title">{rewardedPet.name}</h2>
            <p>{petReward.message}</p>
            <small>{petReward.ownedCount}/{petReward.totalCharacterCount}마리 수집</small>
            <div className="pet-reward-actions">
              <button type="button" disabled={refreshingPets} onClick={() => void closePetReward()}>
                {refreshingPets ? "확인 중..." : "계속하기"}
              </button>
              <button type="button" onClick={() => navigate("/pets")}>펫 도감 보기</button>
            </div>
          </section>
        </div>
      )}

      {(error || notice) && (
        <p className={`api-status ${error ? "error" : "success"} routine-api-status`}>
          {error || notice}
        </p>
      )}

      <button className="routine-skip" onClick={() => navigate("/home")}>
        다음에 할게요
      </button>

      <button
        className="figma-bottom-button"
        disabled={loading}
        onClick={() => routine?.routineGenerated ? navigate("/home") : navigate("/routine/create")}
      >
        {loading ? "불러오는 중..." : routine?.routineGenerated ? "완료하기" : "루틴 만들기"}
      </button>
    </PinkPage>
  );
}

function getRoutineItemStatus(item: RoutineItem) {
  if (item.expired) return `${formatRoutineTime(item.deadlineAt)} 마감됨`;
  if (!item.editable) {
    return `${formatRoutineTime(item.availableAt)}부터 · ${formatRoutineTime(item.deadlineAt)} 마감`;
  }
  return item.completed
    ? `완료 · ${formatRoutineTime(item.deadlineAt)} 마감`
    : `지금 가능 · ${formatRoutineTime(item.deadlineAt)} 마감`;
}

function formatRoutineTime(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  if (!match) return value;

  const hour = Number(match[1]);
  const period = hour < 12 ? "오전" : "오후";
  return `${period} ${hour % 12 || 12}:${match[2]}`;
}

function toTimeInputValue(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : "";
}
