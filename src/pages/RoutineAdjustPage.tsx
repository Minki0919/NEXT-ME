import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
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
  () =>
    changes.length > 0
      ? `${changes.length}개 루틴의 일정이 변경됐어요.`
      : adjustmentAttempted
        ? "요청을 반영했어요. 최신 루틴을 확인해 주세요."
        : "변경 결과를 여기에 안내해 드려요.",
  [adjustmentAttempted, changes.length]
);

async function submit(event: FormEvent) {
  event.preventDefault();

  const request = message.trim();

  if (!request || submitting || !routine) {
    return;
  }

  /*
   * 변경 전 루틴 저장
   * 나중에 실제 어떤 항목이 변경됐는지 비교할 때 사용
   */
  const before = routine;

  setMessages((current) => [
    ...current,
    {
      role: "USER",
      content: request,
    },
  ]);

  setMessage("");
  setSubmitting(true);
  setAdjustmentAttempted(false);
  setError("");

  try {
    /*
     * =====================================================
     * 1. 사용자가 입력한 문장을 그대로 백엔드로 전달
     *
     * 예:
     * "오늘 9시에 퇴근해"
     * "오늘은 11시에 잘 거야"
     * "오늘 야근해"
     *
     * 프론트에서 문장을 변경하거나
     * 루틴명을 강제로 붙이지 않습니다.
     * =====================================================
     */
    const adjusted = await adjustTodayRoutine(request);

    /*
     * POST 응답에 들어있는 변경 결과를 먼저 확인합니다.
     */
    let updated = adjusted;

    let changedItems = findChanges(
      before.items,
      adjusted.items
    );

    /*
     * =====================================================
     * 2. 서버 저장 직후 GET이 이전 데이터를 반환할 수 있으므로
     *    변경을 못 찾았을 때만 잠깐 기다렸다가 재확인
     *
     * 백엔드를 다시 호출해서 AI에게 재질문하는 것이 아닙니다.
     * 단순히 저장된 오늘의 루틴을 다시 조회하는 것입니다.
     * =====================================================
     */
    if (changedItems.length === 0) {
      const retryDelays = [250, 500, 800];

      for (const delay of retryDelays) {
        await wait(delay);

        try {
          const latest = await getTodayRoutine();

          const latestChanges = findChanges(
            before.items,
            latest.items
          );

          /*
           * 최신 서버 상태는 보관
           */
          updated = latest;

          /*
           * 변경점이 발견되면 더 이상 조회할 필요 없음
           */
          if (latestChanges.length > 0) {
            changedItems = latestChanges;
            break;
          }
        } catch {
          /*
           * 조회 재시도 실패는 adjust 요청 자체의
           * 실패로 처리하지 않습니다.
           */
        }
      }
    } else {
      /*
       * POST 응답에서 이미 변경을 확인한 경우에는
       * 저장된 최신 상태를 한 번만 확인합니다.
       *
       * 여기서 GET 응답이 오래된 데이터라면
       * POST의 정상 결과를 절대 덮어쓰지 않습니다.
       */
      await wait(250);

      try {
        const latest = await getTodayRoutine();

        const latestChanges = findChanges(
          before.items,
          latest.items
        );

        /*
         * GET 결과가 POST 결과와 같거나
         * 더 많은 변경을 가지고 있을 때만 사용
         */
        if (
          latestChanges.length >=
          changedItems.length
        ) {
          updated = latest;
          changedItems = latestChanges;
        }
      } catch {
        /*
         * 최신 조회 실패 시
         * POST 응답 그대로 사용
         */
      }
    }

    setRoutine(updated);
    setChanges(changedItems);
    setAdjustmentAttempted(true);

    /*
     * =====================================================
     * 3. 가장 중요한 부분
     *
     * changedItems가 0이라고 해서
     * 백엔드의 정상 coachMessage를 버리지 않습니다.
     *
     * 기존 코드가 이 부분에서 정상 백엔드 응답을
     * "루틴명과 시간을 입력하세요"로 덮어쓰고 있었습니다.
     * =====================================================
     */

    const backendMessage =
      adjusted.coachMessage?.trim() ||
      updated.coachMessage?.trim();

    setMessages((current) => [
      ...current,
      {
        role: "ASSISTANT",

        content:
          backendMessage ||
          (
            changedItems.length > 0
              ? `${changedItems.length}개 루틴의 일정을 변경했어요.`
              : "요청을 반영했어요. 변경된 오늘의 루틴을 확인해 주세요."
          ),
      },
    ]);
  } catch (value) {
    setError(
      value instanceof Error
        ? value.message
        : "루틴 변경 요청을 처리하지 못했습니다."
    );
  } finally {
    setSubmitting(false);
  }
}

  return (
    <PinkPage className="figma-feature-page routine-adjust-page" scroll>
<header className="figma-feature-header routine-adjust-header">
  <h1>
    루틴 수정하기
  </h1>
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
function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}