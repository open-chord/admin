import { Archive, Download, FileUp, ListMusic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { downloadOpenChordArchive, fetchArchivePlaylists, importOpenChordArchive } from "../../api";
import type { ArchiveImportResult, ArchivePlaylist } from "../../types";

export function ArchiveView({ onImported }: { onImported: (result: ArchiveImportResult) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [playlists, setPlaylists] = useState<ArchivePlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchArchivePlaylists().then(setPlaylists).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить плейлисты");
    });
  }, []);

  const importArchive = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onImported(await importOpenChordArchive(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось импортировать архив");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <section className="archive-page page-enter">
      <div className="hero-panel glass archive-hero">
        <div className="hero-copy">
          <span className="overline">.openchord · draft 0.1</span>
          <h2>Забери библиотеку с собой.</h2>
          <p>Аудио, альбомы, порядок треков, обложки и плейлисты в одном проверяемом архиве.</p>
        </div>
        <Archive size={76} strokeWidth={1.15} />
      </div>

      <div className="archive-grid">
        <article className="upload-card glass">
          <span className="upload-symbol"><Download /></span>
          <div><span className="overline">Экспорт</span><h2>Вся библиотека</h2><p>Сервер отдаёт каталог и медиа потоком, не удерживая архив целиком в памяти.</p></div>
          <button className="glass-button primary-action" onClick={() => downloadOpenChordArchive()}><Download /> Скачать всё</button>
        </article>

        <article className="upload-card glass">
          <span className="upload-symbol"><ListMusic /></span>
          <div><span className="overline">Точный экспорт</span><h2>Один плейлист</h2><p>В архив попадут плейлист и полная зависимость его каталога и файлов.</p></div>
          <label className="field"><span>Плейлист</span><select value={selectedPlaylist} onChange={(event) => setSelectedPlaylist(event.target.value)}><option value="">Выбери плейлист</option>{playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name} · {playlist.tracks} треков</option>)}</select></label>
          <button className="glass-button primary-action" disabled={!selectedPlaylist} onClick={() => downloadOpenChordArchive(selectedPlaylist)}><Download /> Скачать плейлист</button>
        </article>

        <article className="upload-card glass archive-import">
          <span className="upload-symbol"><FileUp /></span>
          <div><span className="overline">Восстановление</span><h2>Импорт архива</h2><p>OpenChord проверит структуру, пути, размеры и SHA-256 каждого встроенного файла.</p></div>
          <input ref={input} className="hidden-input" type="file" accept=".openchord,application/vnd.openchord.archive+zip,application/zip" onChange={(event) => void importArchive(event.target.files?.[0])} />
          <button className="glass-button primary-action" disabled={busy} onClick={() => input.current?.click()}><FileUp /> {busy ? "Проверяем…" : "Выбрать архив"}</button>
        </article>
      </div>
      {error && <p className="error-message">{error}</p>}
    </section>
  );
}
