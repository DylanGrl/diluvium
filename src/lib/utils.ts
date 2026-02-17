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
      return "text-blue-500";
    case "Seeding":
      return "text-green-500";
    case "Paused":
      return "text-yellow-500";
    case "Checking":
      return "text-purple-500";
    case "Error":
      return "text-red-500";
    case "Queued":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

export function progressColor(progress: number, state: string): string {
  if (state === "Error") return "bg-red-500";
  if (state === "Paused") return "bg-yellow-500";
  if (progress >= 100) return "bg-green-500";
  return "bg-blue-500";
}
