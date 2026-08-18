import { Navigate } from "react-router-dom";

/**
 * 최신 Figma에서는 피부 타입/피부 고민/세부 질문이 한 화면에 합쳐졌습니다.
 * 예전 URL로 들어온 경우에도 새 통합 화면으로 이어지도록 호환 라우트만 남깁니다.
 */
export default function SkinOverviewPage() {
  return <Navigate to="/profile/skin-detail" replace />;
}
