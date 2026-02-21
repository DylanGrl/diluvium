import { describe, it, expect, vi, afterEach } from "vitest";
import { getBaseUrl } from "./client";

describe("getBaseUrl", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  it("returns empty string when no config", () => {
    expect(getBaseUrl()).toBe("");
  });

  it("returns trimmed URL without trailing slashes when DELUGE_URL is set", () => {
    (globalThis as unknown as { window: Window }).window = {
      __DILUVIUM_CONFIG__: { DELUGE_URL: "http://localhost:8112/" },
    } as unknown as Window;
    expect(getBaseUrl()).toBe("http://localhost:8112");
  });

  it("strips multiple trailing slashes", () => {
    (globalThis as unknown as { window: Window }).window = {
      __DILUVIUM_CONFIG__: { DELUGE_URL: "http://host:8112///" },
    } as unknown as Window;
    expect(getBaseUrl()).toBe("http://host:8112");
  });
});
