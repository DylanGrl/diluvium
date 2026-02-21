const STORAGE_PREFIX = "diluvium_";

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

export type ThemeMode = "dark" | "light" | "system" | "catppuccin" | "catppuccin-latte" | "nord" | "nord-light";

const THEME_CLASSES = ["dark", "catppuccin", "catppuccin-latte", "nord", "nord-light"] as const;

// Dark themes need the "dark" class for Tailwind dark variant to work
const DARK_THEMES: ThemeMode[] = ["dark", "catppuccin", "nord"];

export function applyTheme(mode: ThemeMode) {
  const el = document.documentElement;
  // Remove all theme classes
  el.classList.remove(...THEME_CLASSES);

  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    el.classList.toggle("dark", prefersDark);
  } else {
    // Add the theme class
    if (mode !== "light") {
      el.classList.add(mode);
    }
    // Also add "dark" class for dark themes so Tailwind dark: variant works
    if (DARK_THEMES.includes(mode) && mode !== "dark") {
      el.classList.add("dark");
    }
  }
}

export const store = {
  getTheme: () => getItem<ThemeMode>("theme", "dark"),
  setTheme: (theme: ThemeMode) => setItem("theme", theme),

  getSortColumn: () => getItem<string>("sort_column", "name"),
  setSortColumn: (col: string) => setItem("sort_column", col),

  getSortDirection: () => getItem<"asc" | "desc">("sort_dir", "asc"),
  setSortDirection: (dir: "asc" | "desc") => setItem("sort_dir", dir),

  getPollingInterval: () => getItem<number>("poll_interval", 3000),
  setPollingInterval: (ms: number) => setItem("poll_interval", ms),

  getSelectedColumns: () =>
    getItem<string[]>("columns", [
      "name",
      "size",
      "progress",
      "state",
      "download_payload_rate",
      "upload_payload_rate",
      "eta",
      "ratio",
      "num_seeds",
      "num_peers",
    ]),
  setSelectedColumns: (cols: string[]) => setItem("columns", cols),

  getDetailPanelHeight: () => getItem<number>("detail_height", 280),
  setDetailPanelHeight: (h: number) => setItem("detail_height", h),

  getDefaultDownloadLocation: () => getItem<string>("download_location", ""),
  setDefaultDownloadLocation: (path: string) => setItem("download_location", path),

  getNotificationsEnabled: () => getItem<boolean>("notifications_enabled", false),
  setNotificationsEnabled: (enabled: boolean) => setItem("notifications_enabled", enabled),
};
