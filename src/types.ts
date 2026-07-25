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
