import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KiB", "MiB", "GiB", "TiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec === 0) return "0 B/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatETA(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return "∞";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatRatio(ratio: number): string {
  if (ratio < 0) return "∞";
  return ratio.toFixed(2);
}

export function ratioColor(ratio: number): string {
  if (ratio < 0) return "text-ul"; // ∞ — seeding forever, treat as good
  if (ratio < 1) return "text-state-error";
  if (ratio < 2) return "text-state-warning";
  if (ratio < 5) return "text-ul";
  return "text-brand";
}

export function formatDate(timestamp: number): string {
  if (timestamp <= 0) return "—";
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function torrentStateColor(state: string): string {
  switch (state) {
    case "Downloading":
      return "text-dl";
    case "Seeding":
      return "text-ul";
    case "Paused":
      return "text-state-warning";
    case "Checking":
      return "text-state-check";
    case "Error":
      return "text-state-error";
    case "Queued":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

export function progressColor(progress: number, state: string): string {
  if (state === "Error") return "bg-state-error";
  if (state === "Paused") return "bg-state-warning";
  if (progress >= 100) return "bg-ul";
  return "bg-dl";
}

/** Sanitize a string for use as a download filename (remove path/illegal chars). */
export function sanitizeDownloadFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "_");
}

/** Tracker health derived from torrent message field. Returns null when OK. */
export function trackerHealth(message: string): "error" | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (
    m.includes("error") ||
    m.includes("could not") ||
    m.includes("refused") ||
    m.includes("unreachable") ||
    m.includes("timeout") ||
    m.includes("invalid") ||
    m.includes("not found") ||
    m.includes("failed")
  ) return "error";
  return null;
}

/** Minimal torrent shape needed for sorting — avoids importing full TorrentStatus. */
interface SortableTorrent {
  name: string;
  total_size: number;
  progress: number;
  state: string;
  download_payload_rate: number;
  upload_payload_rate: number;
  eta: number;
  ratio: number;
  num_seeds: number;
  num_peers: number;
  time_added: number;
}

/** Sort value extractor shared between table and dashboard navigation. */
export function getTorrentSortValue(torrent: SortableTorrent, key: string): string | number {
  switch (key) {
    case "name": return torrent.name.toLowerCase();
    case "size": return torrent.total_size;
    case "progress": return torrent.progress;
    case "state": return torrent.state;
    case "download_payload_rate": return torrent.download_payload_rate;
    case "upload_payload_rate": return torrent.upload_payload_rate;
    case "eta": return torrent.eta;
    case "ratio": return torrent.ratio;
    case "num_seeds": return torrent.num_seeds;
    case "num_peers": return torrent.num_peers;
    case "time_added": return torrent.time_added;
    default: return 0;
  }
}

export function sortTorrentsByKey<T extends SortableTorrent>(
  list: T[],
  col: string,
  dir: "asc" | "desc"
): T[] {
  return [...list].sort((a, b) => {
    const va = getTorrentSortValue(a, col);
    const vb = getTorrentSortValue(b, col);
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}
