import { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { useAuth } from "./api/hooks";
import { store, applyTheme } from "./lib/store";
import { Droplets, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function App() {
  const { sessionQuery } = useAuth();
  const sessionErrorToastShown = useRef(false);

  // Show "session expired" toast once when session check fails (e.g. Deluge restart, network)
  useEffect(() => {
    if (sessionQuery.isError && !sessionErrorToastShown.current) {
      sessionErrorToastShown.current = true;
      toast.error("Session expired or connection lost. Please log in again.");
    }
    if (sessionQuery.data === true) sessionErrorToastShown.current = false;
  }, [sessionQuery.isError, sessionQuery.data]);

  // Apply persisted theme on mount + listen for system theme changes
  useEffect(() => {
    const theme = store.getTheme();
    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, []);

  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Droplets className="h-10 w-10 text-brand" />
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
