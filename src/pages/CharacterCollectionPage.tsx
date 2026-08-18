import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { getMyCharacterCatalog, getMyCharacterCollection } from "../api/characters";
import type { CharacterCatalog, CharacterCollection } from "../api/types";
import { getPetVisual } from "../data/pets";

export default function CharacterCollectionPage() {
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CharacterCollection | null>(null);
  const [catalog, setCatalog] = useState<CharacterCatalog | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getMyCharacterCollection(), getMyCharacterCatalog()])
      .then(([nextCollection, nextCatalog]) => {
        if (cancelled) return;
        setCollection(nextCollection);
        setCatalog(nextCatalog);
      })
      .catch((value) => { if (!cancelled) setError(value instanceof Error ? value.message : "캐릭터 수집 현황을 불러오지 못했습니다."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const owned = useMemo(() => catalog?.characters.filter((item) => item.owned) ?? [], [catalog]);
  const current = owned[index] ?? null;
  const visual = current ? getPetVisual(current.characterNumber) : null;

  function move(delta: number) {
    if (owned.length < 2) return;
    setIndex((currentIndex) => (currentIndex + delta + owned.length) % owned.length);
  }

  return (
    <PinkPage className="character-collection-page">
      <header className="figma-feature-header simple"><h1>캐릭터 수집 현황</h1></header>
      <section className="character-collection-content" aria-live="polite">
        {loading && <p className="character-screen-state">캐릭터를 불러오는 중...</p>}
        {!loading && error && <p className="api-status error character-screen-state">{error}</p>}
        {!loading && !error && !visual && <p className="character-screen-state">아직 획득한 캐릭터가 없어요.<br />오늘의 루틴을 완료해 첫 캐릭터를 만나보세요!</p>}
        {visual && current && (
          <>
            <h2>{visual.name}</h2>
            <div className="character-showcase">
              <button type="button" onClick={() => move(-1)} aria-label="이전 캐릭터">‹</button>
              <img src={visual.image} alt={`${visual.name} 캐릭터`} />
              <button type="button" onClick={() => move(1)} aria-label="다음 캐릭터">›</button>
            </div>
            <button className="character-latest-card" type="button" onClick={() => navigate("/pets")}>
              <span>최근 획득 캐릭터</span><strong>{visual.name}</strong>
              <small>{formatCollectedDate(current.collectedAt)} 획득</small>
              <b>{collection?.ownedCount ?? owned.length}/{collection?.totalCharacterCount ?? catalog?.totalCharacterCount ?? 0} 수집</b>
            </button>
          </>
        )}
      </section>
    </PinkPage>
  );
}

function formatCollectedDate(value: string | null) {
  if (!value) return "획득일 미제공";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
