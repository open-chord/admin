import type { Album, ImportDraft, ImportResult, Track } from "./types";

const SERVER_URL_KEY = "openchord.serverUrl";

function normalizeServerUrl(value: string): string {
  const candidate = value.trim() || window.location.origin;
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate) ? candidate : `http://${candidate}`;
  return new URL(withProtocol).origin;
}

export function getServerUrl(): string {
  const configured = window.localStorage.getItem(SERVER_URL_KEY)?.trim();
  return normalizeServerUrl(configured || window.location.origin);
}

export function setServerUrl(value: string): string {
  const normalized = normalizeServerUrl(value);
  window.localStorage.setItem(SERVER_URL_KEY, normalized);
  return normalized;
}

export function serverResource(path: string): string {
  return `${getServerUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function testServerConnection(url: string): Promise<void> {
  const normalized = normalizeServerUrl(url);
  const response = await fetch(`${normalized}/actuator/health`);
  if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
}

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
  return parse(await fetch(serverResource("/api/admin/catalog")));
}

/**
 * Uploads a single track and its optional artwork and lyrics.
 *
 * @param form Multipart track metadata and media.
 * @returns The track created by the server.
 */
export async function uploadTrack(form: FormData): Promise<Track> {
  return parse(await fetch(serverResource("/api/admin/tracks"), { method: "POST", body: form }));
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
    await fetch(serverResource(`/api/admin/tracks/${id}/lyrics`), {
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
  return parse(await fetch(serverResource("/api/admin/imports/analyze"), { method: "POST", body }));
}

/**
 * Commits an administrator-reviewed import draft.
 *
 * @param draft Draft returned by analysis, including unchanged staging identifiers.
 * @returns A summary of the persisted album and performed transcodes.
 */
export async function commitAlbum(draft: ImportDraft): Promise<ImportResult> {
  return parse(
    await fetch(serverResource(`/api/admin/imports/${draft.id}/commit`), {
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
