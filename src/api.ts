import type { Album, ArchiveImportResult, ArchivePlaylist, ImportDraft, ImportResult, Playlist, Track } from "./types";

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

async function graphQl<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(serverResource("/graphql"), {
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
          originalFilename: track.originalFilename,
        })),
      }),
    }),
  );
}

export async function fetchArchivePlaylists(): Promise<ArchivePlaylist[]> {
  return parse(await fetch(serverResource("/api/admin/openchord/playlists")));
}

export function downloadOpenChordArchive(playlistId?: string): void {
  const query = playlistId
    ? `scope=playlist&playlistId=${encodeURIComponent(playlistId)}`
    : "scope=library";
  const link = document.createElement("a");
  link.href = serverResource(`/api/admin/openchord/export?${query}`);
  link.download = "";
  document.body.append(link);
  link.click();
  link.remove();
}

export async function importOpenChordArchive(file: File): Promise<ArchiveImportResult> {
  const body = new FormData();
  body.append("archive", file);
  return parse(await fetch(serverResource("/api/admin/openchord/import"), { method: "POST", body }));
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
