import { Archive, ChevronRight, FolderUp, ListMusic, Music2, Plus, Search, Settings, Sparkles } from "lucide-react";
import type { RefObject } from "react";
import type { View } from "../app/navigation";

type MenuBarProps = {
  menuRef: RefObject<HTMLDivElement | null>;
  openMenu: string | null;
  setOpenMenu: (menu: string | null) => void;
  onSettings: () => void;
  onImportAlbum: () => void;
  onAddTrack: () => void;
  onArchive: () => void;
};

export function MenuBar({
  menuRef,
  openMenu,
  setOpenMenu,
  onSettings,
  onImportAlbum,
  onAddTrack,
  onArchive,
}: MenuBarProps) {
  return (
    <div className="mac-menu-bar" ref={menuRef}>
      <span className="mac-app-icon" aria-hidden="true"><Music2 /></span>
      <div className="menu-anchor">
        <button className="app-menu-name" aria-expanded={openMenu === "app"} onClick={() => setOpenMenu(openMenu === "app" ? null : "app")}>OpenChord</button>
        {openMenu === "app" && (
          <div className="mac-menu-popover app-popover">
            <button disabled>About OpenChord Studio</button>
            <i />
            <button onClick={onSettings}><Settings /> Settings…</button>
          </div>
        )}
      </div>
      <div className="menu-anchor">
        <button aria-expanded={openMenu === "file"} onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}>File</button>
        {openMenu === "file" && (
          <div className="mac-menu-popover">
            <button onClick={onImportAlbum}><FolderUp /> Import Album…</button>
            <button onClick={onAddTrack}><Plus /> Add Track…</button>
            <i />
            <button onClick={onArchive}><Archive /> OpenChord Archive…</button>
          </div>
        )}
      </div>
      <button disabled>Edit</button>
      <button disabled>View</button>
      <button disabled>Window</button>
      <button disabled>Help</button>
    </div>
  );
}

export function Sidebar({
  view,
  navigate,
  serverUrl,
}: {
  view: View;
  navigate: (view: View) => void;
  serverUrl: string;
}) {
  return (
    <aside className="sidebar glass">
      <nav>
        <span className="nav-label">Коллекция</span>
        <button className={view === "albums" || view === "album" ? "active" : ""} onClick={() => navigate("albums")}><Music2 /> <span>Альбомы</span></button>
        <button className={view === "tracks" ? "active" : ""} onClick={() => navigate("tracks")}><ListMusic /> <span>Треки</span></button>
        <button className={view === "lyrics" ? "active" : ""} onClick={() => navigate("lyrics")}><Sparkles /> <span>Lyrics</span></button>
        <button className={view === "archive" ? "active" : ""} onClick={() => navigate("archive")}><Archive /> <span>Архив</span></button>
      </nav>
      <div className="server-state"><i /><span>OpenChord Server<small>{serverUrl.replace(/^https?:\/\//, "")}</small></span></div>
    </aside>
  );
}

export function Toolbar({
  view,
  albumCount,
  itemCount,
  query,
  onQueryChange,
  onBack,
}: {
  view: View;
  albumCount: number;
  itemCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onBack: () => void;
}) {
  const collectionView = view === "albums" || view === "tracks" || view === "lyrics";

  return (
    <header className="topbar">
      <div className="toolbar-title">
        {view === "album" && <button className="toolbar-icon" onClick={onBack} aria-label="Назад"><ChevronRight /></button>}
        {collectionView && (
          <>
            <strong>{view === "albums" ? "Альбомы" : view === "tracks" ? "Все треки" : "Lyrics"}</strong>
            <small className="toolbar-count">{view === "albums" ? `${albumCount} релизов` : `${itemCount} позиций`}</small>
          </>
        )}
        {view === "archive" && <strong>Архив OpenChord</strong>}
      </div>
      <div className="toolbar-actions">
        {collectionView && (
          <label className="toolbar-search">
            <Search />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Поиск в коллекции" />
          </label>
        )}
      </div>
    </header>
  );
}
