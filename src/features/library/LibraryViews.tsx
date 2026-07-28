import { ChevronRight, ListMusic, Music2, PencilLine, Plus, Search, Sparkles } from "lucide-react";
import { serverResource } from "../../api";
import { formatDuration } from "../../shared/format";
import type { Album, Track } from "../../types";

export function AlbumCollection({
  albums,
  visibleAlbums,
  loading,
  onAdd,
  onSelect,
}: {
  albums: Album[];
  visibleAlbums: Album[];
  loading: boolean;
  onAdd: () => void;
  onSelect: (album: Album) => void;
}) {
  return (
    <section className="collection-page page-enter">
      {loading ? (
        <div className="catalog-grid">{[1, 2, 3].map((key) => <div className="album-card skeleton" key={key} />)}</div>
      ) : albums.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : visibleAlbums.length === 0 ? (
        <CompactEmpty title="Nothing found" detail="Try another artist, album, or track name." />
      ) : (
        <div className="catalog-grid">
          {visibleAlbums.map((album) => <AlbumCard key={album.id} album={album} onSelect={() => onSelect(album)} />)}
        </div>
      )}
    </section>
  );
}

function AlbumCard({ album, onSelect }: { album: Album; onSelect: () => void }) {
  return (
    <button className="album-card" type="button" onClick={onSelect}>
      <div className="album-art">
        {album.hasArtwork ? <img src={serverResource(`/media/artwork/${album.id}`)} alt="" /> : <div className="art-fallback"><Music2 /></div>}
        <span>{album.year}</span>
      </div>
      <div className="album-info"><h4>{album.title}</h4><p>{album.artist}</p></div>
      <div className="album-meta"><span><ListMusic /> {album.tracks.length} треков</span><ChevronRight /></div>
    </button>
  );
}

export function AlbumDetail({
  album,
  onEdit,
  onAddTrack,
}: {
  album: Album;
  onEdit: (track: Track) => void;
  onAddTrack: () => void;
}) {
  const totalDuration = album.tracks.reduce((sum, track) => sum + track.durationMs, 0);

  return (
    <section className="album-page page-enter">
      <header className="album-page-header">
        <div className="album-page-art">
          {album.hasArtwork ? <img src={serverResource(`/media/artwork/${album.id}`)} alt="" /> : <div className="art-fallback"><Music2 /></div>}
        </div>
        <div className="album-page-copy">
          <span className="overline">Альбом · {album.year}</span>
          <h1>{album.title}</h1>
          <p>{album.artist}</p>
          <span>{album.tracks.length} треков · {formatDuration(totalDuration)}</span>
          <div className="album-page-actions">
            <button className="toolbar-button primary" onClick={onAddTrack}><Plus /> Добавить трек</button>
            <button className="toolbar-button" disabled title="Требуется API редактирования альбома"><PencilLine /> Метаданные · TODO</button>
          </div>
        </div>
      </header>
      <div className="album-track-table">
        {album.tracks.map((track) => (
          <div className="track" key={track.id}>
            <span className="track-index">{String(track.number).padStart(2, "0")}</span>
            <div><strong>{track.title}</strong><small>{formatDuration(track.durationMs)}</small></div>
            <button onClick={() => onEdit(track)} aria-label={`Редактировать lyrics для ${track.title}`}>
              {track.lyricLines ? <span className="lyrics-ready"><Sparkles /> {track.lyricLines}</span> : <PencilLine />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrackCollection({
  albums,
  lyricsOnly,
  onEdit,
}: {
  albums: Album[];
  lyricsOnly: boolean;
  onEdit: (track: Track) => void;
}) {
  const rows = albums
    .flatMap((album) => album.tracks.map((track) => ({ album, track })))
    .filter(({ track }) => !lyricsOnly || track.lyricLines);

  return (
    <section className="collection-page page-enter">
      {rows.length === 0 ? (
        <CompactEmpty
          title={lyricsOnly ? "No lyrics yet" : "No tracks found"}
          detail={lyricsOnly ? "Add synchronized lyrics from an album or the track list." : "Try changing the search query."}
        />
      ) : (
        <div className="track-collection">
          {rows.map(({ album, track }) => (
            <div className="collection-row" key={track.id}>
              <span className="track-index">{String(track.number).padStart(2, "0")}</span>
              <div><strong>{track.title}</strong><small>{album.artist}</small></div>
              <span>{album.title}</span>
              <span>{formatDuration(track.durationMs)}</span>
              <button onClick={() => onEdit(track)}><PencilLine /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CompactEmpty({ title, detail }: { title: string; detail: string }) {
  return <div className="compact-empty"><Search /><strong>{title}</strong><p>{detail}</p></div>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="empty glass"><span><Music2 /></span><h3>Библиотека пуста</h3><p>Добавь первый трек — он сразу появится в приложении.</p><button className="glass-button primary-action" onClick={onAdd}><Plus /> Добавить трек</button></div>;
}
