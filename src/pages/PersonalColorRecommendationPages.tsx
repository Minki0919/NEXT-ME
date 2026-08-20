import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { ApiError } from "../api/http";
import {
  createMakeupRecommendation,
  createOutfitRecommendation,
  getMakeupRecommendations,
  getOutfitRecommendations,
  getTodayMakeupRecommendation,
  getTodayOutfitRecommendation,
} from "../api/personalColor";
import type { MakeupRecommendation, OutfitRecommendation } from "../api/types";
import outfitChatLogo from "../assets/figma/outfit-chat-logo.png";
import makeupChatLogo from "../assets/figma/makeup-chat-logo.png";
import historyChevronRight from "../assets/figma/history-chevron-right.svg";

type RecommendationKind = "outfit" | "makeup";
type RecommendationResult = OutfitRecommendation | MakeupRecommendation;

export function OutfitRecommendationPage() {
  return <RecommendationBuilder kind="outfit" />;
}

export function MakeupRecommendationPage() {
  return <RecommendationBuilder kind="makeup" />;
}

function RecommendationBuilder({ kind }: { kind: RecommendationKind }) {
  const isOutfit = kind === "outfit";
  const title = isOutfit ? "옷 추천 받기" : "화장품 추천 받기";
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [requestHistory, setRequestHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const log = chatLogRef.current;
    if (!log) return;
    const frame = window.requestAnimationFrame(() => {
      log.scrollTo({ top: log.scrollHeight, behavior: requestHistory.length ? "smooth" : "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, generating, requestHistory, result]);

  useEffect(() => {
    let cancelled = false;
    const load = isOutfit ? getTodayOutfitRecommendation : getTodayMakeupRecommendation;
    void load()
      .then((response) => {
        if (!cancelled) setResult(response);
      })
      .catch((value) => {
        if (!cancelled && !(value instanceof ApiError && value.status === 404)) {
          setError(value instanceof Error ? value.message : "오늘의 추천을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOutfit]);

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    const message = request.trim();
    if (!message || generating) return;
    setRequestHistory((current) => [...current, message]);
    setRequest("");
    setGenerating(true);
    setError("");
    try {
      const response = isOutfit
        ? await createOutfitRecommendation(message)
        : await createMakeupRecommendation(message);
      setResult(response);
    } catch (value) {
      setError(value instanceof Error ? value.message : "맞춤 추천을 생성하지 못했습니다.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PinkPage className="figma-feature-page personal-recommendation-page recommendation-chat-page">
      <RecommendationHeader title={title} chat />
      <main className="recommendation-chat-layout">
        <div ref={chatLogRef} className="recommendation-chat-log" role="log" aria-live="polite">
          <RecommendationMessage logo={isOutfit ? outfitChatLogo : makeupChatLogo}>
            상담을 시작할게요
          </RecommendationMessage>
          <RecommendationMessage logo={isOutfit ? outfitChatLogo : makeupChatLogo}>
            무엇을 도와드릴까요?
          </RecommendationMessage>

          {requestHistory.map((item, index) => (
            <div className="recommendation-message user" key={`${item}-${index}`}>
              <p>{item}</p>
            </div>
          ))}

          {loading && (
            <RecommendationMessage logo={isOutfit ? outfitChatLogo : makeupChatLogo}>
              오늘의 추천을 확인하고 있어요.
            </RecommendationMessage>
          )}
          {generating && (
            <RecommendationMessage logo={isOutfit ? outfitChatLogo : makeupChatLogo}>
              퍼스널 컬러와 요청 내용을 바탕으로 추천을 만들고 있어요...
            </RecommendationMessage>
          )}
          {!loading && !result && !error && requestHistory.length === 0 && (
            <RecommendationMessage logo={isOutfit ? outfitChatLogo : makeupChatLogo}>
              원하는 분위기, 일정 또는 장소를 메시지로 알려주세요.
            </RecommendationMessage>
          )}
          {result && !generating && (
            <div className="recommendation-message assistant result-message">
              <img src={isOutfit ? outfitChatLogo : makeupChatLogo} alt="Next : Me" />
              <section className="recommendation-chat-result">
                <h3>네, 맞춤 추천을 가져와 봤어요!</h3>
                <p>{result.summary}</p>
                <small>{result.personalColor} · {formatDate(result.recommendationDate)}</small>
                {"outfits" in result
                  ? result.outfits.map((item, index) => <OutfitCard item={item} index={index + 1} personalColor={result.personalColor} key={`${item.style}-${index}`} />)
                  : result.cosmetics.map((item, index) => <MakeupCard item={item} index={index + 1} key={`${item.category}-${index}`} />)}
              </section>
            </div>
          )}
          {error && <p className="api-status error recommendation-chat-error">{error}</p>}
        </div>

        <form className="recommendation-chat-input" onSubmit={(event) => void generate(event)}>
          <label className="sr-only" htmlFor={`${kind}-recommendation-request`}>메시지 입력</label>
          <input
            id={`${kind}-recommendation-request`}
            value={request}
            maxLength={1000}
            placeholder="메시지를 입력하세요"
            disabled={generating}
            onChange={(event) => setRequest(event.target.value)}
          />
          <button type="submit" disabled={!request.trim() || generating}>
            {generating ? "대기" : "전송"}
          </button>
        </form>
      </main>
    </PinkPage>
  );
}

function RecommendationMessage({ logo, children }: { logo: string; children: string }) {
  return (
    <div className="recommendation-message assistant">
      <img src={logo} alt="Next : Me" />
      <p>{children}</p>
    </div>
  );
}

function OutfitCard({
  item,
  index,
  personalColor,
}: {
  item: OutfitRecommendation["outfits"][number];
  index: number;
  personalColor: string;
}) {
  const palette = getOutfitPalette(item, personalColor);

  return (
    <article className="personal-recommendation-card">
      <strong>{String(index).padStart(2, "0")}</strong><h4>{item.style}</h4>
      <dl>
        <div><dt>상의</dt><dd>{item.top}</dd></div>
        <div><dt>하의</dt><dd>{item.bottom}</dd></div>
        <div><dt>아우터</dt><dd>{item.outerwear}</dd></div>
        <div><dt>신발</dt><dd>{item.shoes}</dd></div>
        <div><dt>액세서리</dt><dd>{item.accessories}</dd></div>
      </dl>
      <div className="personal-color-swatches" aria-label="추천 컬러 4가지">
        {palette.map((color, colorIndex) => (
          <i
            key={`${color.label}-${colorIndex}`}
            title={color.label}
            aria-label={color.label}
            style={{ backgroundColor: color.value }}
          />
        ))}
      </div>
      <p>{item.reason}</p>
    </article>
  );
}

const COLOR_NAME_MAP: ReadonlyArray<[string, string]> = [
  ["라이트 그레이", "#d9dce2"], ["소프트 블루", "#91b7d9"], ["스카이 블루", "#87ceeb"],
  ["로즈 핑크", "#d98b9b"], ["더스티 핑크", "#c9969f"], ["버건디", "#7f1734"],
  ["라벤더", "#b8a1d9"], ["아이보리", "#fff4d6"], ["오프화이트", "#f8f5ee"],
  ["차콜", "#3f4147"], ["그레이", "#a7a9ad"], ["화이트", "#ffffff"],
  ["블랙", "#202124"], ["네이비", "#24324a"], ["데님", "#5076a3"],
  ["블루", "#4e83c2"], ["민트", "#9ad8c4"], ["올리브", "#7d8448"],
  ["카키", "#77754e"], ["그린", "#5f9a70"], ["크림", "#f5e6c8"],
  ["베이지", "#d8bea0"], ["카멜", "#b98352"], ["브라운", "#795548"],
  ["코랄", "#ee8b78"], ["핑크", "#ef9eae"], ["레드", "#c94b55"],
  ["퍼플", "#8066a8"], ["옐로우", "#e7c75f"], ["오렌지", "#df8a4f"],
  ["실버", "#c7cbd1"], ["골드", "#c9a45b"],
];

const PERSONAL_COLOR_FALLBACKS: ReadonlyArray<[string, string[]]> = [
  ["여름", ["#91b7d9", "#d9dce2", "#3f4147", "#ffffff"]],
  ["겨울", ["#202124", "#ffffff", "#24324a", "#7f1734"]],
  ["봄", ["#ee8b78", "#fff4d6", "#9ad8c4", "#d8bea0"]],
  ["가을", ["#b98352", "#77754e", "#795548", "#c9a45b"]],
];

function getOutfitPalette(item: OutfitRecommendation["outfits"][number], personalColor: string) {
  const candidates = [
    ...item.colorPalette,
    item.top,
    item.bottom,
    item.outerwear,
    item.shoes,
    item.accessories,
  ];
  const resolved: Array<{ label: string; value: string }> = [];

  for (const candidate of candidates) {
    const color = resolveColor(candidate);
    if (!color || resolved.some((item) => item.value === color.value)) continue;
    resolved.push(color);
    if (resolved.length === 4) return resolved;
  }

  const fallback = PERSONAL_COLOR_FALLBACKS.find(([name]) => personalColor.includes(name))?.[1]
    ?? ["#ef9eae", "#d8bea0", "#a7a9ad", "#ffffff"];
  for (const value of fallback) {
    if (resolved.some((item) => item.value === value)) continue;
    resolved.push({ label: `${personalColor} 추천 보조색`, value });
    if (resolved.length === 4) break;
  }
  return resolved;
}

function resolveColor(value: string) {
  const normalized = value.trim().toLowerCase();
  if (/^(#[\da-f]{3,8}|rgba?\(|hsla?\()/i.test(normalized)) {
    return { label: value, value: normalized };
  }
  const match = COLOR_NAME_MAP.find(([name]) => normalized.includes(name.toLowerCase()));
  return match ? { label: value, value: match[1] } : null;
}

function MakeupCard({ item, index }: { item: MakeupRecommendation["cosmetics"][number]; index: number }) {
  return (
    <article className="personal-recommendation-card">
      <strong>{String(index).padStart(2, "0")}</strong><h4>{item.category}</h4>
      <dl>
        <div><dt>제품 유형</dt><dd>{item.productType}</dd></div>
        <div><dt>표현</dt><dd>{item.finish}</dd></div>
        <div><dt>추천 색상</dt><dd>{item.recommendedColors.join(", ")}</dd></div>
      </dl>
      <p>{item.reason}</p>
    </article>
  );
}

type HistoryItem = {
  id: string;
  kind: "옷" | "화장";
  personalColor: string;
  summary: string;
  date: string;
  count: number;
};

export function RecommendationHistoryPage() {
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [makeups, setMakeups] = useState<MakeupRecommendation[]>([]);
  const [activeKind, setActiveKind] = useState<RecommendationKind>("outfit");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getOutfitRecommendations(0, 30), getMakeupRecommendations(0, 30)])
      .then(([outfitPage, makeupPage]) => {
        if (cancelled) return;
        setOutfits(outfitPage.content);
        setMakeups(makeupPage.content);
      })
      .catch((value) => {
        if (!cancelled) setError(value instanceof Error ? value.message : "추천 이력을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const history = useMemo<HistoryItem[]>(() => {
    const selected = activeKind === "outfit"
      ? outfits.map((item) => ({
        id: `outfit-${item.recommendationId}`,
        kind: "옷" as const,
        personalColor: item.personalColor,
        summary: item.summary,
        date: item.createdAt,
        count: item.outfits.length,
      }))
      : makeups.map((item) => ({
        id: `makeup-${item.recommendationId}`,
        kind: "화장" as const,
        personalColor: item.personalColor,
        summary: item.summary,
        date: item.createdAt,
        count: item.cosmetics.length,
      }));
    return selected.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [activeKind, outfits, makeups]);

  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visibleHistory = history.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const firstVisiblePage = Math.min(Math.max(0, safePage - 1), Math.max(0, totalPages - 3));
  const visiblePages = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => firstVisiblePage + index
  );

  function selectKind(kind: RecommendationKind) {
    setActiveKind(kind);
    setPage(0);
  }

  return (
    <PinkPage className="figma-feature-page personal-recommendation-page" scroll>
      <RecommendationHeader title="추천 이력 보기" />
      <main className="personal-recommendation-content recommendation-history-content figma-history-content">
        <div className="recommendation-history-tabs" role="tablist" aria-label="추천 이력 종류">
          <button
            type="button"
            role="tab"
            aria-selected={activeKind === "outfit"}
            className={activeKind === "outfit" ? "active" : ""}
            onClick={() => selectKind("outfit")}
          >
            옷 추천
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeKind === "makeup"}
            className={activeKind === "makeup" ? "active" : ""}
            onClick={() => selectKind("makeup")}
          >
            화장 추천
          </button>
        </div>
        {loading && <section className="personal-recommendation-state"><span className="feature-loader" /><p>추천 이력을 불러오고 있어요.</p></section>}
        {!loading && history.length === 0 && !error && <section className="personal-recommendation-state"><p>저장된 추천 이력이 없습니다.</p></section>}
        <section className="recommendation-history-list" role="tabpanel" aria-label={`${activeKind === "outfit" ? "옷" : "화장"} 추천 이력`}>
          {visibleHistory.map((item) => (
            <article key={item.id}>
              <time>{formatHistoryDate(item.date)}</time>
              <h3>{item.summary}</h3>
              <p>{item.personalColor}에 어울리는 {item.kind} 추천 · 추천 항목 {item.count}개</p>
              <img src={historyChevronRight} alt="" />
            </article>
          ))}
        </section>
        {!loading && history.length > 0 && (
          <nav className="recommendation-history-pagination" aria-label="추천 이력 페이지">
            <button type="button" aria-label="이전 페이지" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>&lt;</button>
            {visiblePages.map((index) => (
              <button
                type="button"
                className={safePage === index ? "active" : ""}
                aria-current={safePage === index ? "page" : undefined}
                onClick={() => setPage(index)}
                key={index}
              >
                {index + 1}
              </button>
            ))}
            <button type="button" aria-label="다음 페이지" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>&gt;</button>
          </nav>
        )}
        {error && <p className="api-status error">{error}</p>}
      </main>
    </PinkPage>
  );
}

function RecommendationHeader({
  title,
  chat = false,
}: {
  title: string;
  chat?: boolean;
}) {
  return (
    <header
      className={`figma-feature-header ${
        chat
          ? "recommendation-chat-header"
          : ""
      }`}
    >
      <h1>
        {title}
      </h1>
    </header>
  );
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${Number(match[2])}월 ${Number(match[3])}일` : value;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}
