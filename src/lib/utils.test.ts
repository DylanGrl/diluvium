import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatSpeed,
  formatETA,
  formatRatio,
  formatDate,
  torrentStateColor,
  progressColor,
  sanitizeDownloadFilename,
} from "./utils";

describe("formatBytes", () => {
  it("returns 0 B for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });
  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500.0 B");
    expect(formatBytes(1024)).toBe("1.0 KiB");
    expect(formatBytes(1536)).toBe("1.5 KiB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MiB");
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GiB");
  });
  it("respects decimals", () => {
    expect(formatBytes(1536, 0)).toBe("2 KiB");
    expect(formatBytes(1536, 2)).toBe("1.50 KiB");
  });
});

describe("formatSpeed", () => {
  it("returns 0 B/s for zero", () => {
    expect(formatSpeed(0)).toBe("0 B/s");
  });
  it("appends /s to formatBytes", () => {
    expect(formatSpeed(1024)).toBe("1.0 KiB/s");
    expect(formatSpeed(1024 * 1024)).toBe("1.0 MiB/s");
  });
});

describe("formatETA", () => {
  it("returns ∞ for non-positive or non-finite", () => {
    expect(formatETA(0)).toBe("∞");
    expect(formatETA(-1)).toBe("∞");
    expect(formatETA(Number.POSITIVE_INFINITY)).toBe("∞");
  });
  it("formats seconds", () => {
    expect(formatETA(45)).toBe("45s");
    expect(formatETA(90)).toBe("1m 30s");
    expect(formatETA(3665)).toBe("1h 1m");
  });
});

describe("formatRatio", () => {
  it("returns ∞ for negative", () => {
    expect(formatRatio(-1)).toBe("∞");
  });
  it("formats to 2 decimals", () => {
    expect(formatRatio(0)).toBe("0.00");
    expect(formatRatio(1.5)).toBe("1.50");
  });
});

describe("formatDate", () => {
  it("returns — for non-positive timestamp", () => {
    expect(formatDate(0)).toBe("—");
    expect(formatDate(-1)).toBe("—");
  });
  it("formats valid timestamp", () => {
    // 2020-01-15 12:00:00 UTC
    const ts = 1579093200;
    const result = formatDate(ts);
    expect(result).toMatch(/\d/);
    expect(result).not.toBe("—");
  });
});

describe("torrentStateColor", () => {
  it("returns correct class for known states", () => {
    expect(torrentStateColor("Downloading")).toBe("text-dl");
    expect(torrentStateColor("Seeding")).toBe("text-ul");
    expect(torrentStateColor("Paused")).toBe("text-state-warning");
    expect(torrentStateColor("Error")).toBe("text-state-error");
    expect(torrentStateColor("Queued")).toBe("text-muted-foreground");
  });
  it("returns muted for unknown state", () => {
    expect(torrentStateColor("Unknown")).toBe("text-muted-foreground");
  });
});

describe("progressColor", () => {
  it("returns error for Error state", () => {
    expect(progressColor(50, "Error")).toBe("bg-state-error");
  });
  it("returns warning for Paused", () => {
    expect(progressColor(50, "Paused")).toBe("bg-state-warning");
  });
  it("returns ul for complete", () => {
    expect(progressColor(100, "Seeding")).toBe("bg-ul");
  });
  it("returns dl for in-progress", () => {
    expect(progressColor(50, "Downloading")).toBe("bg-dl");
  });
});

describe("sanitizeDownloadFilename", () => {
  it("replaces path and illegal chars with underscore", () => {
    expect(sanitizeDownloadFilename("foo/bar")).toBe("foo_bar");
    expect(sanitizeDownloadFilename("foo\\bar")).toBe("foo_bar");
    expect(sanitizeDownloadFilename('a*b?c:d"e<f>g|h')).toBe("a_b_c_d_e_f_g_h");
  });
  it("leaves safe names unchanged", () => {
    expect(sanitizeDownloadFilename("My.Torrent.Name")).toBe("My.Torrent.Name");
    expect(sanitizeDownloadFilename("normal-name_123")).toBe("normal-name_123");
  });
});
