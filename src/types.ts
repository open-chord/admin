export type Track = {
  id: string;
  title: string;
  durationMs: number;
  discNumber: number;
  number: number;
  lyricLines: number;
};

export type Album = {
  id: string;
  title: string;
  year: number;
  artist: string;
  hasArtwork: boolean;
  tracks: Track[];
};

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

export type ImportDraft = {
  id: string;
  artist: string;
  album: string;
  year: number;
  artworkFile: string | null;
  tracks: ImportTrack[];
  issues: string[];
};

export type ImportResult = {
  albumId: string;
  album: string;
  importedTracks: number;
  transcodedTracks: number;
};
