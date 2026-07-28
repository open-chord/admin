import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Album } from "../../types";
import { AlbumCollection, TrackCollection } from "./LibraryViews";

const album: Album = {
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
};

describe("AlbumCollection", () => {
  it("renders albums and selects one", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AlbumCollection albums={[album]} visibleAlbums={[album]} loading={false} onAdd={vi.fn()} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /Diamond Eyes/ }));
    expect(onSelect).toHaveBeenCalledWith(album);
  });

  it("renders a useful search empty state", () => {
    render(<AlbumCollection albums={[album]} visibleAlbums={[]} loading={false} onAdd={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByText("Nothing found")).toBeInTheDocument();
  });
});

describe("TrackCollection", () => {
  it("shows only tracks with lyrics in lyrics mode", () => {
    const withoutLyrics: Album = {
      ...album,
      id: "album-2",
      tracks: [{ ...album.tracks[0], id: "track-2", title: "Royal", lyricLines: 0 }],
    };
    render(<TrackCollection albums={[album, withoutLyrics]} lyricsOnly onEdit={vi.fn()} />);

    expect(screen.getByText("Sextape")).toBeInTheDocument();
    expect(screen.queryByText("Royal")).not.toBeInTheDocument();
  });
});
