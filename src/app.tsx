import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { useAuth } from "./api/hooks";

export function App() {
  const { sessionQuery } = useAuth();

  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          sessionQuery.data ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/*"
        element={
          sessionQuery.data ? (
            <DashboardPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
