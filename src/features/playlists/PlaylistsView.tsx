import { ListMusic, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addTrackToPlaylist, createPlaylist, deletePlaylist, fetchPlaylists, removeTrackFromPlaylist } from "../../api";
import { formatDuration } from "../../shared/format";
import type { Album, Playlist } from "../../types";

export function PlaylistsView({ albums, onError }: { albums: Album[]; onError: (message: string) => void }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [trackId, setTrackId] = useState("");
  const selected = playlists.find((playlist) => playlist.id === selectedId) ?? playlists[0];
  const availableTracks = useMemo(
    () => albums.flatMap((album) => album.tracks.map((track) => ({ ...track, album: album.title, artist: album.artist })))
      .filter((track) => !selected?.tracks.some((entry) => entry.id === track.id)),
    [albums, selected],
  );

  useEffect(() => {
    fetchPlaylists().then((values) => {
      setPlaylists(values);
      setSelectedId((current) => current || values[0]?.id || "");
    }).catch((error: unknown) => onError(error instanceof Error ? error.message : "Не удалось загрузить плейлисты"));
  }, [onError]);

  const replace = (playlist: Playlist) => setPlaylists((current) => current.map((item) => item.id === playlist.id ? playlist : item));

  return (
    <section className="playlist-page page-enter">
      <aside className="playlist-list glass">
        <form onSubmit={(event) => { event.preventDefault(); void createPlaylist(name).then((playlist) => { setPlaylists((current) => [...current, playlist]); setSelectedId(playlist.id); setName(""); }).catch((error: unknown) => onError(error instanceof Error ? error.message : "Не удалось создать плейлист")); }}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Новый плейлист" />
          <button disabled={!name.trim()} aria-label="Создать плейлист"><Plus /></button>
        </form>
        {playlists.map((playlist) => <button key={playlist.id} className={playlist.id === selected?.id ? "active" : ""} onClick={() => setSelectedId(playlist.id)}><ListMusic /><span>{playlist.name}<small>{playlist.tracks.length} треков</small></span></button>)}
      </aside>
      <div className="playlist-detail glass">
        {!selected ? <div className="compact-empty"><ListMusic /><strong>Плейлистов пока нет</strong><p>Создай первый слева.</p></div> : <>
          <header><div><span className="overline">Плейлист</span><h1>{selected.name}</h1><p>{selected.description || "Без описания"}</p></div><button className="toolbar-button" onClick={() => void deletePlaylist(selected.id).then(() => { const next = playlists.filter((item) => item.id !== selected.id); setPlaylists(next); setSelectedId(next[0]?.id || ""); }).catch((error: unknown) => onError(error instanceof Error ? error.message : "Не удалось удалить плейлист"))}><Trash2 /> Удалить</button></header>
          <div className="playlist-add"><select value={trackId} onChange={(event) => setTrackId(event.target.value)}><option value="">Добавить трек…</option>{availableTracks.map((track) => <option key={track.id} value={track.id}>{track.artist} — {track.title} · {track.album}</option>)}</select><button disabled={!trackId} onClick={() => void addTrackToPlaylist(selected.id, trackId).then((playlist) => { replace(playlist); setTrackId(""); }).catch((error: unknown) => onError(error instanceof Error ? error.message : "Не удалось добавить трек"))}><Plus /> Добавить</button></div>
          <div className="playlist-tracks">{selected.tracks.map((track, index) => <div className="collection-row" key={track.id}><span className="track-index">{String(index + 1).padStart(2, "0")}</span><div><strong>{track.title}</strong><small>{track.artistName}</small></div><span>{track.albumTitle}</span><span>{formatDuration(track.durationMs)}</span><button aria-label={`Убрать ${track.title}`} onClick={() => void removeTrackFromPlaylist(selected.id, track.id).then(replace).catch((error: unknown) => onError(error instanceof Error ? error.message : "Не удалось убрать трек"))}><X /></button></div>)}</div>
        </>}
      </div>
    </section>
  );
}
