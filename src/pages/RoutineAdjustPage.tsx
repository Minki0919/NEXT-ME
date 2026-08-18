import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { openAppMenu } from "../components/AppMenu";
import { assets } from "../assets";
import { adjustTodayRoutine, getTodayRoutine } from "../api/routines";
import type { RoutineItem, RoutinePlan } from "../api/types";
import routineAdjustChatLogo from "../assets/figma/routine-adjust-chat-logo.png";

type AdjustMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
};

type ChangedRoutine = {
  id: number;
  title: string;
  before: string;
  after: string;
  changeLabel: string;
};

export default function RoutineAdjustPage() {
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<RoutinePlan | null>(null);
  const [messages, setMessages] = useState<AdjustMessage[]>([
    { role: "ASSISTANT", content: "변경할 일정이나 루틴을 알려주세요." },
  ]);
  const [message, setMessage] = useState("");
  const [changes, setChanges] = useState<ChangedRoutine[]>([]);
  const [adjustmentAttempted, setAdjustmentAttempted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const chatRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;
    const frame = window.requestAnimationFrame(() => {
      chat.scrollTo({ top: chat.scrollHeight, behavior: messages.length > 1 ? "smooth" : "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, messages, submitting]);

  useEffect(() => {
    let cancelled = false;
    void getTodayRoutine()
      .then((result) => {
        if (!cancelled) setRoutine(result);
      })
      .catch((value) => {
        if (!cancelled) setError(value instanceof Error ? value.message : "오늘의 루틴을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasRoutine = routine?.routineGenerated === true;
  const affectedLabel = useMemo(
    () => changes.length > 0
      ? `${changes.length}개 루틴의 일정이 변경됐어요.`
      : adjustmentAttempted
        ? "백엔드 응답에서 실제로 변경된 루틴 시간을 확인하지 못했어요."
        : "변경 결과를 여기에 안내해 드려요.",
    [adjustmentAttempted, changes.length]
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const request = message.trim();
    if (!request || submitting || !routine) return;

    const before = routine;
    setMessages((current) => [...current, { role: "USER", content: request }]);
    setMessage("");
    setSubmitting(true);
    setAdjustmentAttempted(false);
    setError("");
    try {
      const adjusted = await adjustTodayRoutine(request);
      // 조정 응답 직후 서버의 최종 저장본을 다시 조회합니다. 일부 백엔드 구현은
      // 조정 응답보다 조회 응답에서 재계산된 시간 범위를 완전하게 반환합니다.
      const refreshed = await getTodayRoutine().catch(() => adjusted);
      const adjustedChanges = findChanges(before.items, adjusted.items);
      const refreshedChanges = findChanges(before.items, refreshed.items);
      // 저장 직후 조회가 잠시 이전 값을 반환하는 환경도 있으므로 더 완전한 결과를 사용합니다.
      const useRefreshed = refreshedChanges.length >= adjustedChanges.length;
      const updated = useRefreshed ? refreshed : adjusted;
      const changedItems = useRefreshed ? refreshedChanges : adjustedChanges;
      setRoutine(updated);
      setChanges(changedItems);
      setAdjustmentAttempted(true);
      setMessages((current) => [
        ...current,
        {
          role: "ASSISTANT",
          content: changedItems.length > 0
            ? (updated.coachMessage || "일정에 맞춰 해당 루틴을 바로 변경했어요.")
            : "요청은 처리됐지만 서버 응답에서 달라진 루틴 시간을 확인하지 못했어요. 변경할 루틴명과 시간을 함께 입력해 주세요. 예: ‘저녁 세안을 오후 9시로 변경해줘’.",
        },
      ]);
    } catch (value) {
      setError(value instanceof Error ? value.message : "루틴 변경 요청을 처리하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PinkPage className="figma-feature-page routine-adjust-page" scroll>
      <header className="figma-feature-header routine-adjust-header">
        <h1>루틴 수정하기</h1>
        <button type="button" aria-label="전체 메뉴 열기" onClick={openAppMenu}>
          <img src={assets.routineMenu} alt="" />
        </button>
      </header>

      <main className="routine-adjust-content">
        <h2>AI 맞춤 상담</h2>

        <section ref={chatRef} className="routine-adjust-chat" aria-live="polite">
          {messages.map((item, index) => (
            <div className={`routine-adjust-message ${item.role === "USER" ? "user" : "assistant"}`} key={`${item.role}-${index}`}>
              {item.role === "ASSISTANT" && <img src={routineAdjustChatLogo} alt="Next : Me" />}
              <p>{item.content}</p>
            </div>
          ))}
          {submitting && (
            <div className="routine-adjust-message assistant">
              <img src={routineAdjustChatLogo} alt="Next : Me" />
              <p>루틴을 조정하고 있어요...</p>
            </div>
          )}
        </section>

        <form className="routine-adjust-input" onSubmit={submit}>
          <label htmlFor="routine-adjust-request">변경할 내용을 입력하세요</label>
          <div>
            <textarea
              id="routine-adjust-request"
              value={message}
              maxLength={1000}
              disabled={loading || submitting || !hasRoutine}
              placeholder="예: 오늘은 오후 9시에 퇴근해"
              onChange={(event) => setMessage(event.target.value)}
            />
            <button type="submit" disabled={!message.trim() || loading || submitting || !hasRoutine}>
              {submitting ? "변경 중" : "전송"}
            </button>
          </div>
        </form>

        <p className={`routine-adjust-success ${changes.length > 0 ? "visible" : ""}`}>
          {changes.length > 0 ? "변경을 완료했어요" : affectedLabel}
        </p>
        <section className="routine-adjust-result">
          <h3>영향 받는 루틴</h3>
          {changes.length === 0 ? (
            adjustmentAttempted && routine?.items.length ? (
              <div className="routine-adjust-unchanged">
                <p>{affectedLabel}</p>
                <strong>현재 서버에 저장된 루틴 시간</strong>
                <ul>
                  {routine.items.map((item) => (
                    <li key={item.id}>
                      <span>{item.title}<small>변경 확인 안 됨</small></span>
                      <time>{formatCompactTime(item.scheduledTime)}</time>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>{hasRoutine ? affectedLabel : "먼저 오늘의 루틴을 만들어 주세요."}</p>
            )
          ) : (
            <ul>
              {changes.map((item) => (
                <li key={item.id}>
                  <span>{item.title}<small>{item.changeLabel}</small></span>
                  <del>{formatCompactTime(item.before)}</del>
                  <strong>{formatCompactTime(item.after)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        {error && <p className="api-status error">{error}</p>}
        <button type="button" className="figma-feature-primary" onClick={() => navigate("/routine/complete")}>
          완료하기
        </button>
      </main>
    </PinkPage>
  );
}

function findChanges(before: RoutineItem[], after: RoutineItem[]) {
  const beforeById = new Map(before.map((item) => [item.id, item]));
  // 일정 조정 응답에서는 서버가 itemId를 새로 발급할 수 있습니다.
  // 이때도 같은 카테고리(또는 루틴명)의 이전 항목과 비교해 영향받은 루틴을 표시합니다.
  const beforeByCategory = new Map(before.map((item) => [item.category, item]));
  const beforeByTitle = new Map(before.map((item) => [normalizeTitle(item.title), item]));

  return after.flatMap((item) => {
    const previous =
      beforeById.get(item.id) ||
      beforeByTitle.get(normalizeTitle(item.title)) ||
      beforeByCategory.get(item.category);
    if (!previous) {
      return [{
        id: item.id,
        title: item.title,
        before: "추가",
        after: item.scheduledTime,
        changeLabel: "새 루틴",
      }];
    }

    const change = getRoutineChange(previous, item);
    if (!change) return [];
    return [{
      id: item.id,
      title: item.title,
      ...change,
    }];
  });
}

function getRoutineChange(previous: RoutineItem, current: RoutineItem) {
  if (getTimeKey(previous.scheduledTime) !== getTimeKey(current.scheduledTime)) {
    return {
      before: previous.scheduledTime,
      after: current.scheduledTime,
      changeLabel: "실행 시간 변경",
    };
  }
  if (getTimeKey(previous.availableAt) !== getTimeKey(current.availableAt)) {
    return {
      before: previous.availableAt,
      after: current.availableAt,
      changeLabel: "시작 시간 변경",
    };
  }
  if (getTimeKey(previous.deadlineAt) !== getTimeKey(current.deadlineAt)) {
    return {
      before: previous.deadlineAt,
      after: current.deadlineAt,
      changeLabel: "마감 시간 변경",
    };
  }
  if (
    previous.title !== current.title ||
    previous.description !== current.description ||
    previous.completionWindowMinutes !== current.completionWindowMinutes ||
    previous.sortOrder !== current.sortOrder
  ) {
    return {
      before: previous.scheduledTime,
      after: current.scheduledTime,
      changeLabel: "루틴 내용 변경",
    };
  }
  return null;
}

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function getTimeKey(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

function formatCompactTime(value: string) {
  const match = /(?:T|^)(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}
