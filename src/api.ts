import type { Album, Track } from "./types";

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
