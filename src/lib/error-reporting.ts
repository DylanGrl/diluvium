/**
 * Optional error reporting for production. Enable by defining
 * window.__DILUVIUM_REPORT_ERROR__ = (error, errorInfo) => { ... }
 * e.g. Sentry.captureException(error, { extra: errorInfo })
 */
declare global {
  interface Window {
    __DILUVIUM_REPORT_ERROR__?: (error: Error, errorInfo: { componentStack?: string }) => void;
  }
}

export function reportError(error: Error, errorInfo?: { componentStack?: string }): void {
  try {
    if (typeof window !== "undefined" && typeof window.__DILUVIUM_REPORT_ERROR__ === "function") {
      window.__DILUVIUM_REPORT_ERROR__(error, errorInfo ?? {});
    }
  } catch {
    // Avoid breaking the app if the reporter throws
  }
}
