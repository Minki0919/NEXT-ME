import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { openAppMenu } from "../components/AppMenu";
import { sendAiMessage } from "../api/chat";
import { getAuthSession, getStoredProfile } from "../utils/storage";

type UiMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
};

/** 최신 Figma의 '수정된 느낌'(127:199)을 기준으로 상담 화면을 맞췄습니다. */
export default function ChatPage() {
  const navigate = useNavigate();
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const nickname =
    getStoredProfile()?.nickname || getAuthSession()?.name || "사용자";
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([
    { role: "ASSISTANT", content: `${nickname}님, 무엇을 도와드릴까요?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    const frame = window.requestAnimationFrame(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: messages.length > 1 ? "smooth" : "auto",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading, error]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((current) => [...current, { role: "USER", content: message }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await sendAiMessage(message, conversationId);
      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        { role: "ASSISTANT", content: response.answer },
      ]);
    } catch (value) {
      setError(value instanceof Error ? value.message : "AI 답변을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PinkPage className="chat-page">
      <button className="chat-exit" onClick={() => navigate("/consult")}>
        <img src={assets.chatBack} alt="" />
        나가기
      </button>

      <h1>AI 맞춤 상담</h1>
      <button
        type="button"
        className="chat-menu"
        aria-label="전체 메뉴 열기"
        onClick={openAppMenu}
      >
        <img src={assets.chatMenu} alt="" />
      </button>

      <div
        ref={messageListRef}
        className="chat-message-list"
        role="log"
        aria-live="polite"
        aria-label="AI 상담 대화 내용"
      >
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.role}-${index}-${message.content}`}
            side={message.role === "USER" ? "right" : "left"}
            text={message.content}
            large={message.content.length > 80}
          />
        ))}
        {loading && (
          <ChatMessage side="left" text="답변을 작성 중이에요..." />
        )}
        {error && <p className="api-status error chat-api-status">{error}</p>}
      </div>

      <form className="chat-send-form" onSubmit={submit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="피부, 운동, 루틴에 대해 물어보세요"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          title={!input.trim() ? "상담 내용을 입력해 주세요." : undefined}
        >
          {loading ? "대기" : input.trim() ? "전송" : "입력 필요"}
        </button>
      </form>
      <button className="figma-bottom-button chat-end-button" onClick={() => navigate("/game")}>
        상담 종료
      </button>
    </PinkPage>
  );
}

function ChatMessage({ side, text, large = false }: { side: "left" | "right"; text: string; large?: boolean }) {
  return (
    <div className={`chat-message ${side} ${large ? "large" : ""}`}>
      {side === "left" && <img src={assets.chatLogo} alt="Next : Me" />}
      <p>{text}</p>
    </div>
  );
}
