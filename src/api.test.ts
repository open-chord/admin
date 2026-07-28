import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCatalog, getServerUrl, serverResource, setServerUrl, testServerConnection } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("server configuration", () => {
  it("uses the current origin by default", () => {
    expect(getServerUrl()).toBe(window.location.origin);
  });

  it("normalizes and stores a server without a protocol", () => {
    expect(setServerUrl("music.local:8080/path")).toBe("http://music.local:8080");
    expect(getServerUrl()).toBe("http://music.local:8080");
    expect(serverResource("api/admin/catalog")).toBe("http://music.local:8080/api/admin/catalog");
  });

  it("rejects malformed server URLs", () => {
    expect(() => setServerUrl("http://[broken")).toThrow();
  });
});

describe("admin API", () => {
  it("loads the catalog from the configured server", async () => {
    setServerUrl("https://music.example");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCatalog()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith("https://music.example/api/admin/catalog");
  });

  it("reports an unhealthy server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    await expect(testServerConnection("https://music.example")).rejects.toThrow("HTTP 503");
  });
});
