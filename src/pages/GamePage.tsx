import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PinkPage from "../components/PinkPage";
import { assets } from "../assets";
import { getMyCharacterCollection } from "../api/characters";
import type { CharacterCollection } from "../api/types";

export default function GamePage() {
  const navigate = useNavigate();
  const [petCollection, setPetCollection] = useState<CharacterCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getMyCharacterCollection()
      .then((collection) => {
        if (!cancelled) setPetCollection(collection);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PinkPage className="game-page">
 <header className="game-header">
  <img
    src={assets.gameLogo}
    alt="Next : Me"
  />
</header>

      <h1>
        🎉 Next : Me 월드에 오신 것을
        <br />
        환영합니다!
        <br />
        지금 바로 시작해 보세요!
      </h1>

      <button className="game-pet-summary" type="button" onClick={() => navigate("/pets")}>
        <span>내 펫</span>
        <strong>
          {petCollection
            ? `${petCollection.ownedCount}/${petCollection.totalCharacterCount}`
            : "도감 보기"}
        </strong>
      </button>

      <img className="game-ellipse" src={assets.gameEllipse} alt="" />
      <img className="game-makeup" src={assets.gameMakeup} alt="" />
      <img className="game-brush" src={assets.gameBrush} alt="" />

      <button className="game-start-button" onClick={() => navigate("/charts/select")}>
        시작하기
      </button>

      <img className="game-nav-image" src={assets.gameNav} alt="" />

      <nav className="game-hotspots" aria-label="하단 메뉴">
        <button aria-label="게임" onClick={() => navigate("/game")} />
        <button aria-label="차트" onClick={() => navigate("/charts")} />
        <button aria-label="루틴" onClick={() => navigate("/routine")} />
        <button aria-label="프로필" onClick={() => navigate("/profile")} />
      </nav>

    </PinkPage>
  );
}
