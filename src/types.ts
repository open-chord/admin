/** Editable catalog track returned by the administration API. */
export type Track = {
  /** Stable backend identifier. */
  id: string;
  /** Display title. */
  title: string;
  /** Playback duration in milliseconds. */
  durationMs: number;
  /** One-based disc position. */
  discNumber: number;
  /** One-based track position within the disc. */
  number: number;
  /** Number of synchronized lyric segments currently stored. */
  lyricLines: number;
};

/** Album card projection used by the Studio library. */
export type Album = {
  /** Stable backend identifier. */
  id: string;
  /** Display title. */
  title: string;
  /** Release year. */
  year: number;
  /** Album artist display name. */
  artist: string;
  /** Whether the media endpoint can provide artwork. */
  hasArtwork: boolean;
  /** Tracks in disc and track order. */
  tracks: Track[];
};

/** Editable analysis result for one staged audio file. */
export type ImportTrack = {
  /** Opaque staging filename that must be returned unchanged during commit. */
  stagedFile: string;
  /** Original client filename shown for review. */
  originalFilename: string;
  /** Detected or inferred display title. */
  title: string;
  /** One-based disc position. */
  discNumber: number;
  /** One-based track position. */
  number: number;
  /** Probed duration in milliseconds. */
  durationMs: number;
  /** Lowercase source container or codec extension. */
  sourceFormat: string;
  /** Whether commit will normalize this source to ALAC. */
  willTranscode: boolean;
  /** Track-specific metadata warnings. */
  issues: string[];
};

/** Correctable album draft returned by the analysis phase. */
export type ImportDraft = {
  /** Opaque import identifier used by the commit endpoint. */
  id: string;
  /** Most likely album artist. */
  artist: string;
  /** Most likely album title. */
  album: string;
  /** Most likely release year. */
  year: number;
  /** Opaque staged artwork filename, when detected. */
  artworkFile: string | null;
  /** Ordered staged tracks. */
  tracks: ImportTrack[];
  /** Album-level metadata warnings. */
  issues: string[];
};

/** Commit summary displayed after a successful smart import. */
export type ImportResult = {
  /** Identifier of the created album. */
  albumId: string;
  /** Created album title. */
  album: string;
  /** Number of imported tracks. */
  importedTracks: number;
  /** Number of lossless sources converted to ALAC. */
  transcodedTracks: number;
};
