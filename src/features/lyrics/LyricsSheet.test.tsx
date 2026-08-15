import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { LyricsSheet } from "./LyricsSheet";

afterEach(() => vi.unstubAllGlobals());

it("loads existing lyrics and saves a replacement source", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({
      sourceText: "First line\nSecond line",
      status: "SYNCED",
      alignmentAvailable: true,
      alignmentEngine: null,
      alignmentError: null,
      averageConfidence: null,
      lines: [{ id: "line-1", text: "First line", startMs: 1250, endMs: 4500, confidence: null }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({
      sourceText: "Changed line",
      status: "UNSYNCED",
      alignmentAvailable: true,
      alignmentEngine: null,
      alignmentError: null,
      averageConfidence: null,
      lines: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({
      sourceText: "Changed line",
      status: "PROCESSING",
      alignmentAvailable: true,
      alignmentEngine: null,
      alignmentError: null,
      averageConfidence: null,
      lines: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  const onSaved = vi.fn();
  const user = userEvent.setup();

  render(<LyricsSheet
    track={{ id: "track-1", title: "Song", durationMs: 60_000, discNumber: 1, number: 1, lyricLines: 1 }}
    onClose={vi.fn()}
    onSaved={onSaved}
  />);

  expect(await screen.findByLabelText("Синхронизированный LRC")).toHaveValue("[00:01.250] First line");
  await user.clear(screen.getByLabelText("Исходный текст"));
  await user.type(screen.getByLabelText("Исходный текст"), "Changed line");
  await user.click(screen.getByRole("button", { name: "Сохранить исходник" }));

  expect(fetchMock).toHaveBeenLastCalledWith(
    expect.stringContaining("/api/admin/tracks/track-1/lyrics/source"),
    expect.objectContaining({ method: "PUT", body: JSON.stringify({ sourceText: "Changed line" }) }),
  );
  expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ lyricLines: 0 }));
  expect(screen.getByText("Ожидает синхронизации")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Синхронизировать автоматически" }));
  expect(fetchMock).toHaveBeenLastCalledWith(
    expect.stringContaining("/api/admin/tracks/track-1/lyrics/alignment"),
    expect.objectContaining({ method: "POST" }),
  );
  expect(screen.getByText("Синхронизация выполняется")).toBeInTheDocument();
});
