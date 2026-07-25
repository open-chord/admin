import type { Album, ImportDraft, ImportResult, Track } from "./types";

async function parse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Что-то пошло не так");
  return body;
}

export async function fetchCatalog(): Promise<Album[]> {
  return parse(await fetch("/api/admin/catalog"));
}

export async function uploadTrack(form: FormData): Promise<Track> {
  return parse(await fetch("/api/admin/tracks", { method: "POST", body: form }));
}

export async function updateLyrics(id: string, lyrics: string): Promise<Track> {
  return parse(
    await fetch(`/api/admin/tracks/${id}/lyrics`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyrics }),
    }),
  );
}

export async function analyzeAlbum(files: File[]): Promise<ImportDraft> {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  return parse(await fetch("/api/admin/imports/analyze", { method: "POST", body }));
}

export async function commitAlbum(draft: ImportDraft): Promise<ImportResult> {
  return parse(
    await fetch(`/api/admin/imports/${draft.id}/commit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artist: draft.artist,
        album: draft.album,
        year: draft.year,
        artworkFile: draft.artworkFile,
        tracks: draft.tracks.map((track) => ({
          stagedFile: track.stagedFile,
          title: track.title,
          discNumber: track.discNumber,
          number: track.number,
          durationMs: track.durationMs,
          sourceFormat: track.sourceFormat,
        })),
      }),
    }),
  );
}
