import { useCallback, useEffect, useState } from "react";
import PinkPage from "../components/PinkPage";
import { getMyCharacterCatalog } from "../api/characters";
import { ApiError } from "../api/http";
import type { CharacterCatalog } from "../api/types";
import { getPetVisual, LOCKED_PET_IMAGE } from "../data/pets";

export default function PetCatalogPage() {
  const [catalog, setCatalog] = useState<CharacterCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCatalog(await getMyCharacterCatalog());
    } catch (value) {
      setError(
        value instanceof ApiError && value.status === 502
          ? "펫 서비스를 연결할 수 없습니다. character-service 실행 상태를 확인해 주세요."
          : value instanceof Error
            ? value.message
            : "펫 도감을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return (
    <PinkPage className="pet-catalog-page figma-character-catalog" scroll>
      <header className="figma-feature-header simple"><h1>캐릭터 도감</h1></header>

      {catalog?.allCharactersCollected && (
        <p className="pet-catalog-complete">🎉 모든 펫을 수집했어요!</p>
      )}

      <section className="pet-catalog-grid figma-character-list" aria-live="polite">
        {loading && <p className="pet-catalog-state">펫 도감을 불러오는 중...</p>}

        {!loading && error && (
          <div className="pet-catalog-state error">
            <p>{error}</p>
            <button type="button" onClick={() => void loadCatalog()}>다시 불러오기</button>
          </div>
        )}

        {!loading && !error && catalog?.characters.map((pet) => {
          const visual = getPetVisual(pet.characterNumber);
          return (
            <article className={`pet-catalog-card ${pet.owned ? "owned" : "locked"}`} key={pet.characterNumber}>
              <img
                src={pet.owned ? visual.image : LOCKED_PET_IMAGE}
                alt={pet.owned ? `${visual.name} 펫` : "아직 획득하지 않은 펫"}
              />
              <h2>{pet.owned ? visual.name : "???"}</h2>
              <p>{pet.owned ? characterDescription(pet.characterNumber) : "아직 만나지 못한 미지의 캐릭터"}</p>
            </article>
          );
        })}
      </section>
      <p className="figma-character-catalog-note">캐릭터는 다양한 활동을 통해 만날 수 있어요</p>
    </PinkPage>
  );
}

function characterDescription(characterNumber: number) {
  if (characterNumber === 1) return "유머러스한 성격을 가진 넥스트";
  if (characterNumber === 2) return "조용하지만 착한 성격을 가진 미";
  return "새로운 활동으로 만난 특별한 캐릭터";
}
