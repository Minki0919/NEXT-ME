import pet2 from "../assets/pets/pet-2.svg";
import pet3 from "../assets/pets/pet-3.svg";
import nextPet from "../assets/figma/character-next-card.svg";
import lockedPet from "../assets/figma/character-locked.svg";

export const PETS: Record<number, { name: string; image: string }> = {
  1: { name: "넥스트", image: nextPet },
  2: { name: "미", image: pet2 },
  3: { name: "포근이", image: pet3 },
};

export const LOCKED_PET_IMAGE = lockedPet;

export function getPetVisual(characterNumber: number) {
  return PETS[characterNumber] ?? {
    name: `${characterNumber}번 펫`,
    image: lockedPet,
  };
}
