import {
  ArrowUp,
  Check,
  ChevronRight,
  Disc3,
  FileCheck2,
  FileAudio,
  FolderUp,
  ImagePlus,
  ListMusic,
  Music2,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";
import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { analyzeAlbum, commitAlbum, fetchCatalog, updateLyrics, uploadTrack } from "./api";
import type { Album, ImportDraft, ImportResult, Track } from "./types";

type View = "albums" | "tracks" | "lyrics" | "album" | "upload" | "album-import";
type Notice = { text: string; error?: boolean } | null;

const duration = (ms: number) => {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

function App() {
  const [view, setView] = useState<View>("albums");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [editing, setEditing] = useState<Track | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setAlbums(await fetchCatalog());
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : "Сервер недоступен", error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => void refresh(), []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleAlbums = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return albums;
    return albums
      .map((album) => ({
        ...album,
        tracks: album.tracks.filter((track) =>
          `${album.artist} ${album.title} ${track.title}`.toLowerCase().includes(value),
        ),
      }))
      .filter((album) => album.tracks.length);
  }, [albums, query]);

  const featured = albums.find((album) => album.hasArtwork) ?? albums[0];
  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId);

  const navigate = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <div className="mac-menu-bar">
        <span className="mac-app-icon" aria-hidden="true"><Music2 /></span>
        <div className="menu-anchor">
          <button className="app-menu-name" onClick={() => setOpenMenu(openMenu === "app" ? null : "app")}>OpenChord</button>
          {openMenu === "app" && (
            <div className="mac-menu-popover app-popover">
              <button disabled>About OpenChord Studio</button>
              <i />
              <button onClick={() => setOpenMenu(null)}>Settings… <small>TODO</small></button>
            </div>
          )}
        </div>
        <div className="menu-anchor">
          <button onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}>File</button>
          {openMenu === "file" && (
            <div className="mac-menu-popover">
              <button onClick={() => { setOpenMenu(null); navigate("album-import"); }}><FolderUp /> Import Album…</button>
              <button onClick={() => { setOpenMenu(null); navigate("upload"); }}><Plus /> Add Track…</button>
              <i />
              <button disabled>Import OpenChord Archive… <small>TODO</small></button>
              <button disabled>Export Collection… <small>TODO</small></button>
            </div>
          )}
        </div>
        <button onClick={() => setOpenMenu(null)}>Edit</button>
        <button onClick={() => setOpenMenu(null)}>View</button>
        <button onClick={() => setOpenMenu(null)}>Window</button>
        <button onClick={() => setOpenMenu(null)}>Help</button>
      </div>
      <div
        className="artwork-atmosphere"
        style={featured?.hasArtwork ? { backgroundImage: `url(/media/artwork/${featured.id})` } : undefined}
      />
      <Sidebar view={view} navigate={navigate} />

      <main>
        <header className="topbar">
          <div className="toolbar-title">
            {(view === "album" || view === "upload" || view === "album-import") && (
              <button className="toolbar-icon" onClick={() => navigate("albums")} aria-label="Назад"><ChevronRight /></button>
            )}
            {(view === "albums" || view === "tracks" || view === "lyrics") && (
              <>
                <strong>{view === "albums" ? "Альбомы" : view === "tracks" ? "Все треки" : "Lyrics"}</strong>
                <small className="toolbar-count">
                  {view === "albums"
                    ? `${albums.length} релизов`
                    : `${albums.flatMap((album) => album.tracks).filter((track) => view !== "lyrics" || track.lyricLines).length} позиций`}
                </small>
              </>
            )}
          </div>
          <div className="toolbar-actions">
            {(view === "albums" || view === "tracks" || view === "lyrics") && (
              <label className="toolbar-search">
                <Search />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск в коллекции" />
              </label>
            )}
          </div>
        </header>

        {view === "albums" ? (
          <section className="collection-page page-enter">
            {loading ? (
              <div className="catalog-grid">{[1, 2, 3].map((key) => <div className="album-card skeleton" key={key} />)}</div>
            ) : albums.length === 0 ? (
              <EmptyState onAdd={() => navigate("upload")} />
            ) : (
              <div className="catalog-grid">
                {visibleAlbums.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onSelect={() => {
                      setSelectedAlbumId(album.id);
                      navigate("album");
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ) : view === "album" && selectedAlbum ? (
          <AlbumDetail album={selectedAlbum} onEdit={setEditing} onAddTrack={() => navigate("upload")} />
        ) : view === "tracks" || view === "lyrics" ? (
          <TrackCollection albums={visibleAlbums} lyricsOnly={view === "lyrics"} onEdit={setEditing} />
        ) : view === "upload" ? (
          <UploadView
            onCancel={() => navigate(selectedAlbum ? "album" : "albums")}
            onUploaded={async (track) => {
              await refresh();
              navigate(selectedAlbum ? "album" : "albums");
              setNotice({ text: `«${track.title}» добавлен в библиотеку` });
            }}
          />
        ) : (
          <AlbumImportView
            onCancel={() => navigate("albums")}
            onImported={async (result) => {
              await refresh();
              navigate("albums");
              setNotice({
                text: `«${result.album}» импортирован · ${result.importedTracks} треков${result.transcodedTracks ? ` · ${result.transcodedTracks} в ALAC` : ""}`,
              });
            }}
          />
        )}
      </main>

      {editing && (
        <LyricsSheet
          track={editing}
          onClose={() => setEditing(null)}
          onSaved={async (track) => {
            setEditing(null);
            await refresh();
            setNotice({ text: `Lyrics сохранены · ${track.lyricLines} строк` });
          }}
        />
      )}
      {notice && <div className={`notice glass ${notice.error ? "error" : ""}`}>{notice.error ? <X /> : <Check />} {notice.text}</div>}
    </div>
  );
}

function Sidebar({ view, navigate }: { view: View; navigate: (view: View) => void }) {
  return (
    <aside className="sidebar glass">
      <nav>
        <span className="nav-label">Коллекция</span>
        <button className={view === "albums" || view === "album" ? "active" : ""} onClick={() => navigate("albums")}><Music2 /> <span>Альбомы</span></button>
        <button className={view === "tracks" ? "active" : ""} onClick={() => navigate("tracks")}><ListMusic /> <span>Треки</span></button>
        <button className={view === "lyrics" ? "active" : ""} onClick={() => navigate("lyrics")}><Sparkles /> <span>Lyrics</span></button>
      </nav>
      <div className="server-state"><i /><span>OpenChord Server<small>{location.host}</small></span></div>
    </aside>
  );
}

function AlbumCard({ album, onSelect }: { album: Album; onSelect: () => void }) {
  return (
    <button className="album-card" type="button" onClick={onSelect}>
      <div className="album-art">
        {album.hasArtwork ? <img src={`/media/artwork/${album.id}`} alt="" /> : <div className="art-fallback"><Music2 /></div>}
        <span>{album.year}</span>
      </div>
      <div className="album-info">
        <h4>{album.title}</h4>
        <p>{album.artist}</p>
      </div>
      <div className="album-meta">
        <span><ListMusic /> {album.tracks.length} треков</span>
        <ChevronRight />
      </div>
    </button>
  );
}

function AlbumDetail({ album, onEdit, onAddTrack }: { album: Album; onEdit: (track: Track) => void; onAddTrack: () => void }) {
  return (
    <section className="album-page page-enter">
      <header className="album-page-header">
        <div className="album-page-art">
          {album.hasArtwork ? <img src={`/media/artwork/${album.id}`} alt="" /> : <div className="art-fallback"><Music2 /></div>}
        </div>
        <div className="album-page-copy">
          <span className="overline">Альбом · {album.year}</span>
          <h1>{album.title}</h1>
          <p>{album.artist}</p>
          <span>{album.tracks.length} треков · {duration(album.tracks.reduce((sum, track) => sum + track.durationMs, 0))}</span>
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
            <div><strong>{track.title}</strong><small>{duration(track.durationMs)}</small></div>
            <button onClick={() => onEdit(track)} aria-label={`Редактировать lyrics для ${track.title}`}>
              {track.lyricLines ? <span className="lyrics-ready"><Sparkles /> {track.lyricLines}</span> : <PencilLine />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrackCollection({ albums, lyricsOnly, onEdit }: { albums: Album[]; lyricsOnly: boolean; onEdit: (track: Track) => void }) {
  const rows = albums.flatMap((album) => album.tracks.map((track) => ({ album, track })))
    .filter(({ track }) => !lyricsOnly || track.lyricLines);
  return (
    <section className="collection-page page-enter">
      <div className="track-collection">
        {rows.map(({ album, track }) => (
          <div className="collection-row" key={track.id}>
            <span className="track-index">{String(track.number).padStart(2, "0")}</span>
            <div><strong>{track.title}</strong><small>{album.artist}</small></div>
            <span>{album.title}</span>
            <span>{duration(track.durationMs)}</span>
            <button onClick={() => onEdit(track)}><PencilLine /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="empty glass"><span><Music2 /></span><h3>Библиотека пуста</h3><p>Добавь первый трек — он сразу появится в приложении.</p><button className="glass-button primary-action" onClick={onAdd}><Plus /> Добавить трек</button></div>;
}

function UploadView({ onCancel, onUploaded }: { onCancel: () => void; onUploaded: (track: Track) => void }) {
  const [audio, setAudio] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLInputElement>(null);
  const artworkRef = useRef<HTMLInputElement>(null);

  const chooseAudio = (file?: File) => {
    if (!file) return;
    setAudio(file);
    const objectUrl = URL.createObjectURL(file);
    const element = new Audio(objectUrl);
    element.onloadedmetadata = () => {
      setDurationMs(Math.round(element.duration * 1000));
      URL.revokeObjectURL(objectUrl);
    };
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!audio || !durationMs) return setError("Выбери аудио и дождись определения длительности");
    setSubmitting(true);
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      data.set("audio", audio);
      data.set("durationMs", String(durationMs));
      if (artwork) data.set("artwork", artwork);
      onUploaded(await uploadTrack(data));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить трек");
      setSubmitting(false);
    }
  };

  return (
    <form className="upload-card glass page-enter" onSubmit={submit}>
      <div className="upload-lead">
        <span className="upload-symbol"><Music2 /></span>
        <div><span className="overline">Новая музыка</span><h2>Соберём релиз.</h2><p>Аудио, метаданные, обложка и lyrics — всё сразу попадёт в OpenChord.</p></div>
      </div>
      <div className="upload-layout">
        <div className="form-stack">
          <DropField
            icon={<FileAudio />}
            title={audio?.name ?? "Перетащи аудиофайл"}
            hint={audio ? `${(audio.size / 1024 / 1024).toFixed(1)} МБ${durationMs ? ` · ${duration(durationMs)}` : " · читаю файл…"}` : "MP3, M4A, AAC, WAV или FLAC"}
            onClick={() => audioRef.current?.click()}
            onDrop={chooseAudio}
          />
          <input ref={audioRef} className="hidden-input" type="file" accept="audio/*" onChange={(event) => chooseAudio(event.target.files?.[0])} />
          <div className="field-pair">
            <Field name="artist" label="Исполнитель" placeholder="Deftones" required />
            <Field name="album" label="Альбом" placeholder="Diamond Eyes" required />
          </div>
          <Field name="title" label="Название трека" placeholder="Sextape" required />
          <div className="field-triplet">
            <Field name="releaseYear" label="Год" type="number" defaultValue="2026" required />
            <Field name="discNumber" label="Диск" type="number" defaultValue="1" required />
            <Field name="trackNumber" label="Номер" type="number" defaultValue="1" required />
          </div>
        </div>
        <div className="form-stack secondary-column">
          <button className="artwork-picker" type="button" onClick={() => artworkRef.current?.click()}>
            {artwork ? <img src={URL.createObjectURL(artwork)} alt="Выбранная обложка" /> : <><ImagePlus /><strong>Добавить обложку</strong><small>Квадрат, желательно от 1000 px</small></>}
            {artwork && <span className="change-art glass">Сменить обложку</span>}
          </button>
          <input ref={artworkRef} className="hidden-input" type="file" accept="image/*" onChange={(event) => setArtwork(event.target.files?.[0] ?? null)} />
          <label className="field lyrics-field"><span>Lyrics <small>необязательно · LRC</small></span><textarea name="lyrics" rows={9} placeholder={"[00:12.40] Первая строка\n[00:17.80] Вторая строка"} /></label>
          <p className="form-tip"><Sparkles /> Можно вставить обычный текст — сервер создаст черновые интервалы.</p>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <footer className="form-footer"><button type="button" className="glass-button" onClick={onCancel}>Отмена</button><button className="glass-button primary-action" disabled={submitting}><Upload /> {submitting ? "Загружаю…" : "Добавить в OpenChord"}</button></footer>
    </form>
  );
}

function AlbumImportView({
  onCancel,
  onImported,
}: {
  onCancel: () => void;
  onImported: (result: ImportResult) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const inspect = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      setDraft(await analyzeAlbum(files));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось прочитать альбом");
    } finally {
      setBusy(false);
    }
  };

  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void inspect([...event.dataTransfer.files]);
  };

  const updateTrack = (index: number, field: "title" | "number" | "discNumber", value: string) => {
    if (!draft) return;
    const tracks = [...draft.tracks];
    tracks[index] = { ...tracks[index], [field]: field === "title" ? value : Number(value) };
    setDraft({ ...draft, tracks });
  };

  const commit = async () => {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      onImported(await commitAlbum(draft));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Импорт не завершён");
      setBusy(false);
    }
  };

  if (!draft) {
    return (
      <section className="smart-import glass page-enter">
        <div className="import-intro">
          <span className="upload-symbol"><WandSparkles /></span>
          <div>
            <span className="overline">Умный импорт</span>
            <h2>Просто отдай нам папку.</h2>
            <p>OpenChord прочитает теги, соберёт альбом и подготовит lossless-файлы для Apple-устройств.</p>
          </div>
        </div>
        <button
          className="album-drop"
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={drop}
        >
          <span><FolderUp /></span>
          <strong>{busy ? "Читаю метаданные…" : "Перетащи папку с альбомом"}</strong>
          <small>FLAC, ALAC, WAV, MP3, M4A + JPG или PNG</small>
          <i>{busy ? "FFprobe анализирует треки" : "Выбрать папку"}</i>
        </button>
        <input
          ref={input}
          className="hidden-input"
          type="file"
          multiple
          {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={(event) => void inspect([...(event.target.files ?? [])])}
        />
        <div className="import-promises">
          <div><FileCheck2 /><strong>Проверим теги</strong><small>Найдём расхождения до импорта</small></div>
          <div><Disc3 /><strong>Соберём альбом</strong><small>Номера, диски и обложка</small></div>
          <div><Sparkles /><strong>FLAC → ALAC</strong><small>Автоматически и без потерь</small></div>
        </div>
        {error && <p className="form-error import-error">{error}</p>}
        <footer className="form-footer"><button className="glass-button" onClick={onCancel}>Отмена</button></footer>
      </section>
    );
  }

  return (
    <section className="review-card glass page-enter">
      <div className="review-head">
        <div>
          <span className="overline">Черновик импорта</span>
          <h2>Проверь альбом.</h2>
          <p>Мы заполнили всё, что смогли найти в тегах и именах файлов.</p>
        </div>
        <span className={`health-badge ${draft.issues.length ? "warning" : ""}`}>
          {draft.issues.length ? `${draft.issues.length} замечания` : "Всё готово"}
        </span>
      </div>
      <div className="review-album">
        <Field label="Исполнитель" value={draft.artist} onChange={(event) => setDraft({ ...draft, artist: event.target.value })} />
        <Field label="Альбом" value={draft.album} onChange={(event) => setDraft({ ...draft, album: event.target.value })} />
        <Field label="Год" type="number" value={draft.year} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })} />
      </div>
      {draft.issues.length > 0 && (
        <div className="issue-strip">{draft.issues.map((issue) => <span key={issue}><Sparkles /> {issue}</span>)}</div>
      )}
      <div className="review-table">
        <div className="review-row review-labels"><span>№</span><span>Трек</span><span>Источник</span><span>Результат</span></div>
        {draft.tracks.map((track, index) => (
          <div className="review-row" key={track.stagedFile}>
            <div className="position-inputs">
              <input aria-label="Диск" type="number" min="1" value={track.discNumber} onChange={(event) => updateTrack(index, "discNumber", event.target.value)} />
              <input aria-label="Номер" type="number" min="1" value={track.number} onChange={(event) => updateTrack(index, "number", event.target.value)} />
            </div>
            <div className="review-title">
              <input value={track.title} onChange={(event) => updateTrack(index, "title", event.target.value)} />
              <small>{track.originalFilename} · {duration(track.durationMs)}</small>
            </div>
            <span className="format-pill">{track.sourceFormat.toUpperCase()}</span>
            <span className={`result-pill ${track.willTranscode ? "alac" : ""}`}>
              {track.willTranscode ? "ALAC · lossless" : "Без конвертации"}
            </span>
          </div>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      <footer className="form-footer">
        <button className="glass-button" onClick={() => setDraft(null)}>Назад</button>
        <button className="glass-button primary-action" disabled={busy} onClick={() => void commit()}>
          <Upload /> {busy ? "Импортирую…" : `Импортировать ${draft.tracks.length} треков`}
        </button>
      </footer>
    </section>
  );
}

function DropField({ icon, title, hint, onClick, onDrop }: { icon: React.ReactNode; title: string; hint: string; onClick: () => void; onDrop: (file?: File) => void }) {
  const drop = (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); onDrop(event.dataTransfer.files[0]); };
  return <button className="drop-field" type="button" onClick={onClick} onDragOver={(event) => event.preventDefault()} onDrop={drop}><span>{icon}</span><strong>{title}</strong><small>{hint}</small><i>Выбрать файл <ArrowUp /></i></button>;
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...input } = props;
  return <label className="field"><span>{label}</span><input {...input} min={input.type === "number" ? 1 : input.min} /></label>;
}

function LyricsSheet({ track, onClose, onSaved }: { track: Track; onClose: () => void; onSaved: (track: Track) => void }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try { onSaved(await updateLyrics(track.id, value)); } finally { setSaving(false); } };
  return <div className="sheet-backdrop" onMouseDown={onClose}><section className="lyrics-sheet glass" onMouseDown={(event) => event.stopPropagation()}><button className="sheet-close" onClick={onClose}><X /></button><span className="overline">Синхронизация</span><h2>{track.title}</h2><p>Каждая строка начинается с таймкода <code>[01:24.50]</code></p><textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder={"[00:00.00] Первая строка\n[00:05.20] Следующая строка"} /><footer><button className="glass-button" onClick={onClose}>Отмена</button><button className="glass-button primary-action" onClick={save} disabled={saving}><Check /> {saving ? "Сохраняю…" : "Сохранить lyrics"}</button></footer></section></div>;
}

export default App;
