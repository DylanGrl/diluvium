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

export const store = {
  getTheme: () => getItem<"dark" | "light">("theme", "dark"),
  setTheme: (theme: "dark" | "light") => setItem("theme", theme),

  getApiEndpoint: () => getItem<string>("api_endpoint", ""),
  setApiEndpoint: (url: string) => setItem("api_endpoint", url),

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
      "download_speed",
      "upload_speed",
      "eta",
      "ratio",
      "state",
    ]),
  setSelectedColumns: (cols: string[]) => setItem("columns", cols),
};
