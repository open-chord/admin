import type { Album, ArchiveImportResult, ArchivePlaylist, ImportDraft, ImportResult, LyricsDocument, Playlist, Track } from "./types";

const SERVER_URL_KEY = "openchord.serverUrl";
const ACCESS_TOKEN_KEY = "openchord.accessToken";

export function setAccessToken(token: string | null): void {
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function hasAccessToken(): boolean { return Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY)); }

export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token && Object.keys(init).length === 0) return fetch(input);
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

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
  const resource = `${getServerUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token || !path.startsWith("/media/")) return resource;
  const url = new URL(resource);
  url.searchParams.set("access_token", token);
  return url.toString();
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

async function graphQl<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await authorizedFetch(serverResource("/graphql"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json() as { data?: T; errors?: { message: string }[] };
  if (!response.ok || body.errors?.length || !body.data) {
    throw new Error(body.errors?.[0]?.message || `Server returned HTTP ${response.status}`);
  }
  return body.data;
}

/**
 * Fetches the catalog projection used by Studio.
 *
 * @returns Albums with their editable track summaries.
 * @throws {Error} When the server rejects the request or returns its error envelope.
 */
export async function fetchCatalog(): Promise<Album[]> {
  return parse(await authorizedFetch(serverResource("/api/admin/catalog")));
}

/**
 * Uploads a single track and its optional artwork and lyrics.
 *
 * @param form Multipart track metadata and media.
 * @returns The track created by the server.
 */
export async function uploadTrack(form: FormData): Promise<Track> {
  return parse(await authorizedFetch(serverResource("/api/admin/tracks"), { method: "POST", body: form }));
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
    await authorizedFetch(serverResource(`/api/admin/tracks/${id}/lyrics`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyrics }),
    }),
  );
}

/** Loads the editable source and synchronized intervals for a track. */
export async function fetchLyrics(id: string): Promise<LyricsDocument> {
  return parse(await authorizedFetch(serverResource(`/api/admin/tracks/${id}/lyrics`)));
}

/** Stores unsynchronized source text and invalidates timings derived from an older source. */
export async function updateLyricsSource(id: string, sourceText: string): Promise<LyricsDocument> {
  return parse(
    await authorizedFetch(serverResource(`/api/admin/tracks/${id}/lyrics/source`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceText }),
    }),
  );
}

/** Queues local speech recognition and forced alignment for the stored source text. */
export async function startLyricsAlignment(id: string): Promise<LyricsDocument> {
  return parse(
    await authorizedFetch(serverResource(`/api/admin/tracks/${id}/lyrics/alignment`), {
      method: "POST",
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
  return parse(await authorizedFetch(serverResource("/api/admin/imports/analyze"), { method: "POST", body }));
}

/**
 * Commits an administrator-reviewed import draft.
 *
 * @param draft Draft returned by analysis, including unchanged staging identifiers.
 * @returns A summary of the persisted album and performed transcodes.
 */
export async function commitAlbum(draft: ImportDraft): Promise<ImportResult> {
  return parse(
    await authorizedFetch(serverResource(`/api/admin/imports/${draft.id}/commit`), {
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
          originalFilename: track.originalFilename,
        })),
      }),
    }),
  );
}

export async function fetchArchivePlaylists(): Promise<ArchivePlaylist[]> {
  return parse(await authorizedFetch(serverResource("/api/admin/openchord/playlists")));
}

export async function downloadOpenChordArchive(playlistId?: string): Promise<void> {
  const query = playlistId
    ? `scope=playlist&playlistId=${encodeURIComponent(playlistId)}`
    : "scope=library";
  const response = await authorizedFetch(serverResource(`/api/admin/openchord/export?${query}`));
  if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await response.blob());
  link.download = "";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export async function importOpenChordArchive(file: File): Promise<ArchiveImportResult> {
  const body = new FormData();
  body.append("archive", file);
  return parse(await authorizedFetch(serverResource("/api/admin/openchord/import"), { method: "POST", body }));
}

const PLAYLIST_FIELDS = "id name description artworkUrl tracks { id title durationMs artistName albumTitle }";

export async function fetchPlaylists(): Promise<Playlist[]> {
  return (await graphQl<{ playlists: Playlist[] }>(`query { playlists { ${PLAYLIST_FIELDS} } }`)).playlists;
}

export async function createPlaylist(name: string): Promise<Playlist> {
  return (await graphQl<{ createPlaylist: Playlist }>(
    `mutation CreatePlaylist($name: String!) { createPlaylist(name: $name) { ${PLAYLIST_FIELDS} } }`,
    { name },
  )).createPlaylist;
}

export async function deletePlaylist(id: string): Promise<void> {
  await graphQl<{ deletePlaylist: boolean }>(
    "mutation DeletePlaylist($id: ID!) { deletePlaylist(id: $id) }",
    { id },
  );
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<Playlist> {
  return (await graphQl<{ addTrackToPlaylist: Playlist }>(
    `mutation AddTrack($playlistId: ID!, $trackId: ID!) { addTrackToPlaylist(playlistId: $playlistId, trackId: $trackId) { ${PLAYLIST_FIELDS} } }`,
    { playlistId, trackId },
  )).addTrackToPlaylist;
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<Playlist> {
  return (await graphQl<{ removeTrackFromPlaylist: Playlist }>(
    `mutation RemoveTrack($playlistId: ID!, $trackId: ID!) { removeTrackFromPlaylist(playlistId: $playlistId, trackId: $trackId) { ${PLAYLIST_FIELDS} } }`,
    { playlistId, trackId },
  )).removeTrackFromPlaylist;
}
