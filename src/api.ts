import type {
  Album,
  ArchiveImportResult,
  ArchivePlaylist,
  ImportDraft,
  ImportResult,
  Track,
} from "./types";

async function parse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Что-то пошло не так");
  return body;
}

/**
 * Fetches the catalog projection used by Studio.
 *
 * @returns Albums with their editable track summaries.
 * @throws {Error} When the server rejects the request or returns its error envelope.
 */
export async function fetchCatalog(): Promise<Album[]> {
  return parse(await fetch("/api/admin/catalog"));
}

/**
 * Uploads a single track and its optional artwork and lyrics.
 *
 * @param form Multipart track metadata and media.
 * @returns The track created by the server.
 */
export async function uploadTrack(form: FormData): Promise<Track> {
  return parse(await fetch("/api/admin/tracks", { method: "POST", body: form }));
}

/**
 * Replaces all synchronized lyrics for a track.
 *
 * @param id Identifier of the track to update.
 * @param lyrics Complete LRC document, or an empty string to remove lyrics.
 * @returns The updated track projection.
 */
export async function updateLyrics(id: string, lyrics: string): Promise<Track> {
  return parse(
    await fetch(`/api/admin/tracks/${id}/lyrics`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyrics }),
    }),
  );
}

/**
 * Stages a folder selection and detects metadata without changing the catalog.
 *
 * @param files Audio and artwork files selected by the administrator.
 * @returns A correctable import draft with opaque staged filenames.
 */
export async function analyzeAlbum(files: File[]): Promise<ImportDraft> {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  return parse(await fetch("/api/admin/imports/analyze", { method: "POST", body }));
}

/**
 * Commits an administrator-reviewed import draft.
 *
 * @param draft Draft returned by analysis, including unchanged staging identifiers.
 * @returns A summary of the persisted album and performed transcodes.
 */
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

/** Returns playlists that can be exported as self-contained archives. */
export async function fetchArchivePlaylists(): Promise<ArchivePlaylist[]> {
  return parse(await fetch("/api/admin/openchord/playlists"));
}

/** Starts a browser download without buffering the archive in JavaScript. */
export function downloadOpenChordArchive(playlistId?: string): void {
  const query = playlistId
    ? `scope=playlist&playlistId=${encodeURIComponent(playlistId)}`
    : "scope=library";
  const link = document.createElement("a");
  link.href = `/api/admin/openchord/export?${query}`;
  link.download = "";
  document.body.append(link);
  link.click();
  link.remove();
}

/** Uploads and commits one portable OpenChord archive. */
export async function importOpenChordArchive(file: File): Promise<ArchiveImportResult> {
  const body = new FormData();
  body.append("archive", file);
  return parse(
    await fetch("/api/admin/openchord/import", {
      method: "POST",
      body,
    }),
  );
}
