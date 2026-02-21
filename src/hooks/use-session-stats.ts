import { useEffect, useRef, useState } from "react";
import type { UpdateUIResult } from "@/api/types";

export interface SessionStats {
  totalDownloaded: number;
  totalUploaded: number;
}

export function useSessionStats(
  stats: UpdateUIResult["stats"] | undefined,
): SessionStats {
  const lastTickRef = useRef<number>(Date.now());
  const [session, setSession] = useState<SessionStats>({
    totalDownloaded: 0,
    totalUploaded: 0,
  });

  useEffect(() => {
    if (!stats) return;

    const now = Date.now();
    const elapsed = Math.min((now - lastTickRef.current) / 1000, 10); // cap at 10 s
    lastTickRef.current = now;

    setSession((prev) => ({
      totalDownloaded: prev.totalDownloaded + stats.download_rate * elapsed,
      totalUploaded: prev.totalUploaded + stats.upload_rate * elapsed,
    }));
  }, [stats]);

  return session;
}
