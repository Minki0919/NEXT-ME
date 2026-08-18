import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
  scroll?: boolean;
}>;

export default function PinkPage({ children, className = "", scroll = false }: Props) {
  return (
    <main className={`pink-page ${scroll ? "pink-page-scroll" : ""} ${className}`.trim()}>
      {children}
    </main>
  );
}
