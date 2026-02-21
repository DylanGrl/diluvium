import { useEffect, useRef } from "react";
import type { TorrentStatus } from "@/api/types";

export function useTorrentNotifications(
  torrents: Record<string, TorrentStatus>,
  enabled: boolean,
) {
  const prevStatesRef = useRef<Record<string, string>>({});
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const snapshot = Object.fromEntries(
      Object.entries(torrents).map(([hash, t]) => [hash, t.state]),
    );

    if (
      !enabled ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    ) {
      // Keep snapshot in sync so we don't fire spurious notifications
      // the moment notifications are enabled.
      prevStatesRef.current = snapshot;
      isFirstLoadRef.current = Object.keys(torrents).length === 0;
      return;
    }

    // Skip the very first populated snapshot to avoid notifying for
    // torrents that were already seeding when the page loaded.
    if (isFirstLoadRef.current) {
      prevStatesRef.current = snapshot;
      isFirstLoadRef.current = false;
      return;
    }

    for (const [hash, torrent] of Object.entries(torrents)) {
      const prev = prevStatesRef.current[hash];
      if (prev === "Downloading" && torrent.state === "Seeding") {
        new Notification("Download complete", {
          body: torrent.name,
          icon: "/favicon.ico",
        });
      }
    }

    prevStatesRef.current = snapshot;
  }, [torrents, enabled]);
}
