import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasValidAuthSession } from "../auth/session";

export default function ProtectedRoute() {
  const location = useLocation();

  if (!hasValidAuthSession()) {
    return <Navigate to="/email-login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
