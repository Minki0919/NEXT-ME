import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { ApiError } from "../api/http";
import { openAppMenu } from "../components/AppMenu";
import {
  generateMyUserCareRecommendation,
  getLatestMyUserCareRecommendation,
} from "../api/userCare";
import type { CareIngredient, UserCareRecommendation } from "../api/types";
import { getAuthSession, getStoredProfile } from "../utils/storage";

type CareTab = "recommended" | "caution";

export default function UserCarePage() {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<UserCareRecommendation | null>(null);
  const [selectedTab, setSelectedTab] = useState<CareTab>("recommended");
  const [initialLoading, setInitialLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const nickname = getStoredProfile()?.nickname || getAuthSession()?.name || "사용자";

  const loadLatest = useCallback(async () => {
    setInitialLoading(true);
    setError("");
    setErrorStatus(null);
    try {
      const latest = await getLatestMyUserCareRecommendation();
      setRecommendation(latest);
      setEmpty(false);
    } catch (value) {
      if (value instanceof ApiError && value.status === 404) {
        setRecommendation(null);
        setEmpty(true);
      } else {
        const status = value instanceof ApiError ? value.status : null;
        setErrorStatus(status);
        setError(getUserCareErrorMessage(value));
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLatest();
  }, [loadLatest]);

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError("");
    setErrorStatus(null);
    try {
      const generated = await generateMyUserCareRecommendation();
      setRecommendation(generated);
      setSelectedTab("recommended");
      setEmpty(false);
    } catch (value) {
      setErrorStatus(value instanceof ApiError ? value.status : null);
      setError(getUserCareErrorMessage(value));
    } finally {
      setGenerating(false);
    }
  }

  const displayedItems = useMemo(
    () => (selectedTab === "recommended"
      ? recommendation?.recommendedIngredients ?? []
      : recommendation?.cautionIngredients ?? []).slice(0, 3),
    [recommendation, selectedTab]
  );

  return (
    <PinkPage className="figma-feature-page user-care-page" scroll>
      <header className="figma-feature-header user-care-feature-header">
        <h1>피부 관리 가이드</h1>
        <button type="button" aria-label="전체 메뉴 열기" onClick={openAppMenu}>
          <img src={assets.routineMenu} alt="" />
        </button>
      </header>

      {initialLoading && (
        <section className="user-care-state" aria-live="polite">
          <span className="user-care-loader" aria-hidden="true" />
          <h2>최근 추천을 확인하고 있어요</h2>
        </section>
      )}

      {!initialLoading && generating && !recommendation && (
        <section className="user-care-state" aria-live="polite">
          <span className="user-care-loader" aria-hidden="true" />
          <h2>새 피부 관리 추천을 만들고 있어요</h2>
          <p>현재 프로필을 분석해 추천과 주의 성분을 각각 3개씩 준비하고 있습니다.</p>
        </section>
      )}

      {!initialLoading && !generating && !recommendation && !error && empty && (
        <section className="user-care-state">
          <span className="user-care-state-icon" aria-hidden="true">+</span>
          <h2>아직 추천 결과가 없어요</h2>
          <p>완성된 피부 프로필을 기준으로 추천 성분과 주의 성분을 알려드릴게요.</p>
          <button type="button" disabled={generating} onClick={() => void generate()}>
            {generating ? "AI 추천 생성 중..." : "첫 추천 만들기"}
          </button>
        </section>
      )}

      {!initialLoading && !generating && error && (
        <section className="user-care-state error" role="alert">
          <span className="user-care-state-icon" aria-hidden="true">!</span>
          <h2>추천을 불러오지 못했어요</h2>
          <p>{error}</p>
          <div className="user-care-state-actions">
            {errorStatus === 400 && (
              <button type="button" onClick={() => navigate("/profile/basic")}>프로필 완성하기</button>
            )}
            {errorStatus !== 401 && (
              <button type="button" disabled={generating} onClick={() => void generate()}>
                {generating ? "다시 요청 중..." : "추천 다시 생성하기"}
              </button>
            )}
          </div>
        </section>
      )}

      {!initialLoading && recommendation && (
        <main className="user-care-guide-content">
          <h2><strong>{nickname}</strong>님의 대표적인<br />추천 / 비추천 성분이에요</h2>

          <div className="user-care-profile-tags">
            <span>피부 타입 <b>{recommendation.skinType}</b></span>
            <span>피부 고민 <b>{recommendation.concerns}</b></span>
          </div>

          <div className="user-care-tabs" role="tablist" aria-label="성분 추천 구분">
            <button
              type="button"
              role="tab"
              aria-selected={selectedTab === "recommended"}
              className={selectedTab === "recommended" ? "active" : ""}
              onClick={() => setSelectedTab("recommended")}
            >
              추천해요 <b>{Math.min(3, recommendation.recommendedIngredients.length)}</b>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedTab === "caution"}
              className={selectedTab === "caution" ? "active caution" : ""}
              onClick={() => setSelectedTab("caution")}
            >
              주의해요 <b>{Math.min(3, recommendation.cautionIngredients.length)}</b>
            </button>
          </div>

          <section className={`user-care-guide-callout ${selectedTab}`}>
            <strong>{selectedTab === "caution" ? "⚠ 주의하세요" : "✓ 추천해요"}</strong>
            <p>
              {selectedTab === "caution"
                ? `${nickname}님께 맞지 않을 수 있는 성분이 포함된 제품을 확인하세요.`
                : `${nickname}님의 피부 타입과 고민에 도움이 되는 성분이에요.`}
            </p>
          </section>

          <section className="user-care-list" role="tabpanel">
            {displayedItems.map((item, index) => (
              <CareIngredientCard
                key={`${selectedTab}-${item.careArea}-${item.ingredient}-${index}`}
                item={item}
                caution={selectedTab === "caution"}
                index={index + 1}
              />
            ))}
          </section>

          <p className="user-care-guide-summary">{recommendation.summary}</p>
          <p className="user-care-disclaimer">
            {recommendation.disclaimer}<br />
            <small>{formatCreatedAt(recommendation.createdAt)} 생성</small>
          </p>
          <button className="user-care-regenerate" type="button" disabled={generating} onClick={() => void generate()}>
            {generating ? "새 추천 생성 중..." : "현재 프로필로 새로 추천받기"}
          </button>
        </main>
      )}
    </PinkPage>
  );
}

function CareIngredientCard({
  item,
  caution,
  index,
}: {
  item: CareIngredient;
  caution: boolean;
  index: number;
}) {
  return (
    <article className={`user-care-card ${caution ? "caution" : "recommended"}`}>
      <header>
        <span className="user-care-warning-icon" aria-hidden="true">{caution ? "⚠" : "✓"}</span>
        <div>
          <small>{item.careArea === "CLEANSING" ? "세안" : "스킨케어"} · {item.productType}</small>
          <h2>{item.ingredient}</h2>
        </div>
        <span className="user-care-card-number">{String(index).padStart(2, "0")}</span>
      </header>
      <hr />
      <ul>
        <li>{item.reason}</li>
        <li>{item.guidance}</li>
      </ul>
    </article>
  );
}

function getUserCareErrorMessage(value: unknown) {
  if (value instanceof ApiError) {
    if (value.status === 400) return value.message || "추천 전에 피부 프로필을 먼저 완성해 주세요.";
    if (value.status === 401) return "로그인이 필요합니다. 로그인 화면으로 이동합니다.";
    if (value.status === 502) return "AI 피부 관리 추천 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    return value.message;
  }
  return value instanceof Error ? value.message : "피부 관리 추천 요청에 실패했습니다.";
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
