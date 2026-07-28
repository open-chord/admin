export type View = "albums" | "tracks" | "lyrics" | "album" | "upload" | "album-import";

export type Notice = {
  text: string;
  error?: boolean;
} | null;
