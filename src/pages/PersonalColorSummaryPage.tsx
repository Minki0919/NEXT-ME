import { useEffect, useState } from "react";
import PinkPage from "../components/PinkPage";
import { getMyProfile } from "../api/users";
import type { UserProfile } from "../api/types";
import { getStoredPersonalColorAnalysis, getStoredProfile, saveProfile } from "../utils/storage";

export default function PersonalColorSummaryPage() {
  const [profile, setProfile] = useState<UserProfile | null>(getStoredProfile());
  const [error, setError] = useState("");
  const storedAnalysis = getStoredPersonalColorAnalysis();

  useEffect(() => {
    let cancelled = false;
    void getMyProfile()
      .then((result) => {
        if (cancelled) return;
        setProfile(result);
        saveProfile(result);
      })
      .catch((value) => { if (!cancelled) setError(value instanceof Error ? value.message : "분석 결과를 불러오지 못했습니다."); });
    return () => { cancelled = true; };
  }, []);

  const confidence = normalizeConfidence(profile?.personalColorConfidence ?? storedAnalysis?.personalColorConfidence ?? 0);
  const color = profile?.personalColor || storedAnalysis?.detectedPersonalColor || "분석 전";

  return (
    <PinkPage className="personal-color-summary-page">
      <header className="figma-feature-header simple"><h1>퍼스널 컬러 확인</h1></header>
      <section className="personal-color-summary-card">
        <p>나의 퍼스널 컬러</p>
        <h2>{color}</h2>
        <div className="personal-color-confidence" style={{ "--confidence": `${confidence * 3.6}deg` } as React.CSSProperties}><span className="personal-color-confidence-label">AI 사진 신뢰도</span><strong>{confidence}%</strong></div>
        <span>프로필에 저장된 분석 결과예요</span>
        {error && <p className="api-status error">{error}</p>}
      </section>
    </PinkPage>
  );
}

function normalizeConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return Math.round(Math.max(0, Math.min(100, normalized)));
}
