import { Check, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getServerUrl, fetchCatalog, serverResource } from "./api";
import type { Notice, View } from "./app/navigation";
import { MenuBar, Sidebar, Toolbar } from "./components/AppChrome";
import { AlbumImportSheet } from "./features/import/AlbumImportSheet";
import { TrackUploadSheet } from "./features/import/TrackUploadSheet";
import { AlbumCollection, AlbumDetail, TrackCollection } from "./features/library/LibraryViews";
import { LyricsSheet } from "./features/lyrics/LyricsSheet";
import { SettingsSheet } from "./features/settings/SettingsSheet";
import { ArchiveView } from "./features/archive/ArchiveView";
import { PlaylistsView } from "./features/playlists/PlaylistsView";
import type { Album, Track } from "./types";

function App() {
  const [view, setView] = useState<View>("albums");
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [editing, setEditing] = useState<Track | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [uploadAlbumId, setUploadAlbumId] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuBar = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuBar.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenMenu(null);
      setSettingsOpen(false);
      setEditing(null);
      setView((current) =>
        current === "upload" || current === "album-import"
          ? selectedAlbumId
            ? "album"
            : "albums"
          : current,
      );
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [selectedAlbumId]);

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
  const itemCount = albums
    .flatMap((album) => album.tracks)
    .filter((track) => view !== "lyrics" || track.lyricLines).length;

  const navigate = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeWorkflow = () => navigate(selectedAlbum ? "album" : "albums");
  const showError = useCallback((text: string) => setNotice({ text, error: true }), []);

  return (
    <div className="app-shell">
      <MenuBar
        menuRef={menuBar}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        onSettings={() => { setOpenMenu(null); setSettingsOpen(true); }}
        onImportAlbum={() => { setOpenMenu(null); navigate("album-import"); }}
        onAddTrack={() => { setOpenMenu(null); setUploadAlbumId(""); navigate("upload"); }}
        onArchive={() => { setOpenMenu(null); navigate("archive"); }}
      />
      <div
        className="artwork-atmosphere"
        style={featured?.hasArtwork ? { backgroundImage: `url(${serverResource(`/media/artwork/${featured.id}`)})` } : undefined}
      />
      <Sidebar view={view} navigate={navigate} serverUrl={getServerUrl()} />

      <main>
        <Toolbar
          view={view}
          albumCount={albums.length}
          itemCount={itemCount}
          query={query}
          onQueryChange={setQuery}
          onBack={() => navigate("albums")}
        />

        {view === "albums" && (
          <AlbumCollection
            albums={albums}
            visibleAlbums={visibleAlbums}
            loading={loading}
            onAdd={() => navigate("upload")}
            onSelect={(album) => {
              setSelectedAlbumId(album.id);
              navigate("album");
            }}
          />
        )}
        {view === "album" && selectedAlbum && (
          <AlbumDetail
            album={selectedAlbum}
            onEdit={setEditing}
            onAddTrack={() => {
              setUploadAlbumId(selectedAlbum.id);
              navigate("upload");
            }}
          />
        )}
        {(view === "tracks" || view === "lyrics") && (
          <TrackCollection albums={visibleAlbums} lyricsOnly={view === "lyrics"} onEdit={setEditing} />
        )}
        {view === "playlists" && <PlaylistsView albums={albums} onError={showError} />}
        {view === "archive" && (
          <ArchiveView
            onImported={async (result) => {
              await refresh();
              setNotice({
                text: `Архив импортирован · ${result.albums} альбомов · ${result.tracks} треков · ${result.playlists} плейлистов${result.skippedAlbums ? ` · ${result.skippedAlbums} пропущено` : ""}`,
              });
            }}
          />
        )}
      </main>

      {view === "upload" && (
        <TrackUploadSheet
          defaults={albums.find((album) => album.id === uploadAlbumId)}
          onCancel={closeWorkflow}
          onUploaded={async (track) => {
            await refresh();
            closeWorkflow();
            setNotice({ text: `«${track.title}» добавлен в библиотеку` });
          }}
        />
      )}
      {view === "album-import" && (
        <AlbumImportSheet
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
      {settingsOpen && (
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          onSaved={async () => {
            setSettingsOpen(false);
            setLoading(true);
            await refresh();
            setNotice({ text: "Server connection updated" });
          }}
        />
      )}
      {notice && <div className={`notice glass ${notice.error ? "error" : ""}`}>{notice.error ? <X /> : <Check />} {notice.text}</div>}
    </div>
  );
}

export default App;
