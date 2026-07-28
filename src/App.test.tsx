import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { Album } from "./types";

const catalog: Album[] = [{
  id: "album-1",
  title: "Diamond Eyes",
  artist: "Deftones",
  year: 2010,
  hasArtwork: false,
  tracks: [{
    id: "track-1",
    title: "Sextape",
    number: 1,
    discNumber: 1,
    durationMs: 242_000,
    lyricLines: 4,
  }],
}];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(catalog), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App workflows", () => {
  it("loads the catalog and opens an album", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole("button", { name: /Diamond Eyes Deftones/ }));

    expect(screen.getByRole("heading", { name: "Diamond Eyes" })).toBeInTheDocument();
    expect(screen.getByText("1 треков · 4:02")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Редактировать lyrics/ })).toBeInTheDocument();
  });

  it("opens and closes the add-track workflow from the File menu", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: /Diamond Eyes Deftones/ });

    await user.click(screen.getByRole("button", { name: "File" }));
    await user.click(screen.getByRole("button", { name: "Add Track…" }));

    expect(screen.getByRole("heading", { name: "Соберём релиз." })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(screen.queryByRole("heading", { name: "Соберём релиз." })).not.toBeInTheDocument();
  });

  it("opens settings from the application menu", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("button", { name: /Diamond Eyes Deftones/ });

    await user.click(screen.getByRole("button", { name: "OpenChord" }));
    await user.click(screen.getByRole("button", { name: "Settings…" }));

    expect(screen.getByRole("heading", { name: "OpenChord Server" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Server URL" })).toHaveValue(window.location.origin);
  });
});
