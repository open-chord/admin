import { Disc3, FileCheck2, FolderUp, Sparkles, Upload, WandSparkles, X } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";
import { analyzeAlbum, commitAlbum } from "../../api";
import { Field } from "../../shared/Field";
import { formatDuration } from "../../shared/format";
import type { ImportDraft, ImportResult } from "../../types";

export function AlbumImportSheet({
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
      <div className="sheet-backdrop workflow-backdrop" onMouseDown={onCancel}>
        <section className="smart-import workflow-sheet glass" onMouseDown={(event) => event.stopPropagation()}>
          <button className="sheet-close" onClick={onCancel} aria-label="Закрыть"><X /></button>
          <div className="import-intro">
            <span className="upload-symbol"><WandSparkles /></span>
            <div>
              <span className="overline">Умный импорт</span>
              <h2>Просто отдай нам папку.</h2>
              <p>OpenChord прочитает теги, соберёт альбом и подготовит lossless-файлы для Apple-устройств.</p>
            </div>
          </div>
          <button className="album-drop" type="button" onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={drop}>
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
      </div>
    );
  }

  return (
    <div className="sheet-backdrop workflow-backdrop" onMouseDown={onCancel}>
      <section className="review-card workflow-sheet glass" onMouseDown={(event) => event.stopPropagation()}>
        <button className="sheet-close" onClick={onCancel} aria-label="Закрыть"><X /></button>
        <div className="review-head">
          <div>
            <span className="overline">Черновик импорта</span>
            <h2>Проверь альбом.</h2>
            <p>Мы заполнили всё, что смогли найти в тегах и именах файлов.</p>
          </div>
          <span className={`health-badge ${draft.issues.length ? "warning" : ""}`}>{draft.issues.length ? `${draft.issues.length} замечания` : "Всё готово"}</span>
        </div>
        <div className="review-album">
          <Field label="Исполнитель" value={draft.artist} onChange={(event) => setDraft({ ...draft, artist: event.target.value })} />
          <Field label="Альбом" value={draft.album} onChange={(event) => setDraft({ ...draft, album: event.target.value })} />
          <Field label="Год" type="number" value={draft.year} onChange={(event) => setDraft({ ...draft, year: Number(event.target.value) })} />
        </div>
        {draft.issues.length > 0 && <div className="issue-strip">{draft.issues.map((issue) => <span key={issue}><Sparkles /> {issue}</span>)}</div>}
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
                <small>{track.originalFilename} · {formatDuration(track.durationMs)}</small>
              </div>
              <span className="format-pill">{track.sourceFormat.toUpperCase()}</span>
              <span className={`result-pill ${track.willTranscode ? "alac" : ""}`}>{track.willTranscode ? "ALAC · lossless" : "Без конвертации"}</span>
            </div>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        <footer className="form-footer">
          <button className="glass-button" onClick={() => setDraft(null)}>Назад</button>
          <button className="glass-button primary-action" disabled={busy} onClick={() => void commit()}><Upload /> {busy ? "Импортирую…" : `Импортировать ${draft.tracks.length} треков`}</button>
        </footer>
      </section>
    </div>
  );
}
