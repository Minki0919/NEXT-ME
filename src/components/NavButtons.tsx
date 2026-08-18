export function NextButton({ onClick, children = "다음으로 넘어가기" }: { onClick: () => void; children?: string }) {
  return (
    <button type="button" className="pink-primary-button" onClick={onClick}>
      {children}
    </button>
  );
}

export function PrevButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="pink-text-button" onClick={onClick}>
      이전
    </button>
  );
}
