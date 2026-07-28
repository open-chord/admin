/** Track projection returned by the administration API. */
export type Track = {
  id: string;
  title: string;
  durationMs: number;
  discNumber: number;
  number: number;
  lyricLines: number;
};

/** Album projection used by the Studio library. */
export type Album = {
  id: string;
  title: string;
  year: number;
  artist: string;
  hasArtwork: boolean;
  tracks: Track[];
};

/**
 * Editable analysis result for one staged audio file.
 *
 * `stagedFile` is an opaque server-issued token and must be returned unchanged.
 */
export type ImportTrack = {
  stagedFile: string;
  originalFilename: string;
  title: string;
  discNumber: number;
  number: number;
  durationMs: number;
  sourceFormat: string;
  willTranscode: boolean;
  issues: string[];
};

/**
 * Correctable album draft returned by the non-destructive analysis phase.
 *
 * The draft identifier and staged filenames form the capability required by
 * the commit endpoint; clients must not derive or rewrite either value.
 */
export type ImportDraft = {
  id: string;
  artist: string;
  album: string;
  year: number;
  artworkFile: string | null;
  tracks: ImportTrack[];
  issues: string[];
};

/** Summary returned after a reviewed album has been committed. */
export type ImportResult = {
  albumId: string;
  album: string;
  importedTracks: number;
  transcodedTracks: number;
};

/** Playlist offered as the root of a portable archive export. */
export type ArchivePlaylist = {
  id: string;
  name: string;
  tracks: number;
};

/** Summary returned after a committed `.openchord` import. */
export type ArchiveImportResult = {
  albums: number;
  tracks: number;
  playlists: number;
  skippedAlbums: number;
};
