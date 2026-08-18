import { useEffect, useRef, useState } from "react";
import { sendAiMessage } from "../api/chat";
import assistantLogo from "../assets/figma/profile-assistant-logo.png";
import assistantSend from "../assets/figma/profile-assistant-send.svg";
import assistantClose from "../assets/figma/profile-assistant-close.svg";

type AssistantMessage = {
  id: string;
  role: "ASSISTANT" | "USER";
  content: string;
};

export default function ProfileAssistantDialog({
  nickname,
  open,
  onClose,
  onMinimize,
}: {
  nickname: string;
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
}) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { id: "welcome", role: "ASSISTANT", content: `안녕하세요, ${nickname || "사용자"}님!` },
    { id: "sample", role: "USER", content: "안녕~ 👋👋" },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "USER", content: message }]);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await sendAiMessage(message, conversationId);
      setConversationId(response.conversationId);
      setMessages((current) => [...current, {
        id: `assistant-${response.createdAt}-${current.length}`,
        role: "ASSISTANT",
        content: response.outOfScope
          ? "범위에서 벗어난 질문입니다.\n피부, 운동, 루틴과 관련된 내용을 질문해주세요."
          : response.answer,
      }]);
    } catch (value) {
      setError(value instanceof Error ? value.message : "AI 답변을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="profile-assistant-overlay" role="presentation">
      <section className="profile-assistant-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-assistant-title">
        <header>
          <h2 id="profile-assistant-title">Next : Me</h2>
          <div className="profile-assistant-window-actions">
            <button type="button" className="profile-assistant-minimize" onClick={onMinimize} aria-label="AI 대화창 최소화">−</button>
            <button type="button" onClick={onClose} aria-label="AI 대화창 닫기"><img src={assistantClose} alt="" /></button>
          </div>
        </header>

        <div className="profile-assistant-log" ref={logRef} aria-live="polite">
          {messages.map((message) => (
            <div className={`profile-assistant-message ${message.role === "USER" ? "user" : "assistant"}`} key={message.id}>
              {message.role === "ASSISTANT" && <img src={assistantLogo} alt="Next : Me" />}
              <p>{message.content}</p>
            </div>
          ))}
          {loading && <div className="profile-assistant-message assistant"><img src={assistantLogo} alt="" /><p>답변을 생각하고 있어요…</p></div>}
        </div>

        {error && <p className="api-status error profile-assistant-error">{error}</p>}

        <div className="profile-assistant-input">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void send(); }}
            placeholder="메세지를 입력하세요"
            aria-label="AI에게 보낼 메시지"
          />
          <button type="button" disabled={!input.trim() || loading} onClick={() => void send()} aria-label="메시지 보내기"><img src={assistantSend} alt="" /></button>
        </div>
      </section>
    </div>
  );
}
