import { Check, FileText, Sparkles, TimerReset, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchLyrics, startLyricsAlignment, updateLyrics, updateLyricsSource } from "../../api";
import type { LyricLine, LyricsDocument, LyricsStatus, Track } from "../../types";

function linesAsLrc(lines: LyricLine[]): string {
  return lines.map((line) => {
    const minutes = Math.floor(line.startMs / 60_000);
    const seconds = Math.floor((line.startMs % 60_000) / 1_000);
    const fraction = line.startMs % 1_000;
    return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(3, "0")}] ${line.text}`;
  }).join("\n");
}

const statusLabel: Record<LyricsStatus, string> = {
  EMPTY: "Нет текста",
  UNSYNCED: "Ожидает синхронизации",
  PROCESSING: "Синхронизация выполняется",
  NEEDS_REVIEW: "Нужно проверить",
  FAILED: "Ошибка синхронизации",
  SYNCED: "Синхронизировано",
};

export function LyricsSheet({
  track,
  onClose,
  onSaved,
}: {
  track: Track;
  onClose: () => void;
  onSaved: (track: Track) => void;
}) {
  const [source, setSource] = useState("");
  const [savedSource, setSavedSource] = useState("");
  const [lrc, setLrc] = useState("");
  const [status, setStatus] = useState<LyricsStatus>("EMPTY");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"align" | "lrc" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alignmentAvailable, setAlignmentAvailable] = useState(false);
  const [averageConfidence, setAverageConfidence] = useState<number | null>(null);

  const applyDocument = (document: LyricsDocument) => {
    setSource(document.sourceText);
    setSavedSource(document.sourceText);
    setLrc(linesAsLrc(document.lines));
    setStatus(document.status);
    setAlignmentAvailable(document.alignmentAvailable);
    setAverageConfidence(document.averageConfidence);
    setError(document.alignmentError);
  };

  useEffect(() => {
    let cancelled = false;
    void fetchLyrics(track.id)
      .then((document) => {
        if (cancelled) return;
        applyDocument(document);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Не удалось загрузить lyrics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [track.id]);

  useEffect(() => {
    if (status !== "PROCESSING") return;
    const timer = window.setInterval(() => {
      void fetchLyrics(track.id).then((document) => {
        applyDocument(document);
        if (document.status !== "PROCESSING") {
          onSaved({ ...track, lyricLines: document.lines.length });
        }
      }).catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Не удалось проверить статус синхронизации");
      });
    }, 1500);
    return () => window.clearInterval(timer);
  }, [status, track, onSaved]);

  const align = async () => {
    setSaving("align");
    setError(null);
    try {
      if (source !== savedSource) {
        applyDocument(await updateLyricsSource(track.id, source));
        onSaved({ ...track, lyricLines: 0 });
      }
      applyDocument(await startLyricsAlignment(track.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось запустить синхронизацию");
    } finally {
      setSaving(null);
    }
  };

  const saveLrc = async () => {
    setSaving("lrc");
    setError(null);
    try {
      const saved = await updateLyrics(track.id, lrc);
      setStatus(saved.lyricLines ? "SYNCED" : source.trim() ? "UNSYNCED" : "EMPTY");
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить таймкоды");
    } finally {
      setSaving(null);
    }
  };

  const sourceDirty = source !== savedSource;
  const reviewReady = status === "NEEDS_REVIEW" || status === "SYNCED";
  const activeStep = !source.trim() ? 1 : reviewReady ? 3 : 2;

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="lyrics-sheet glass" onMouseDown={(event) => event.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть"><X /></button>
        <span className="overline">Синхронизация</span>
        <h2>{track.title}</h2>
        <div className="lyrics-summary">
          <p className={`lyrics-status lyrics-status-${status.toLowerCase()}`}>{statusLabel[status]}</p>
          {averageConfidence !== null && <p>Уверенность модели: {Math.round(averageConfidence * 100)}%</p>}
        </div>
        <ol className="lyrics-steps" aria-label="Этапы синхронизации">
          <li className={activeStep >= 1 ? "active" : ""}><b>1</b><span><strong>Текст</strong><small>Добавьте или проверьте слова</small></span></li>
          <li className={activeStep >= 2 ? "active" : ""}><b>2</b><span><strong>Синхронизация</strong><small>Получите автоматические таймкоды</small></span></li>
          <li className={activeStep >= 3 ? "active" : ""}><b>3</b><span><strong>Публикация</strong><small>Проверьте результат и сохраните</small></span></li>
        </ol>
        {loading ? <p>Загружаю lyrics…</p> : <div className="lyrics-editor-grid">
          <div className="lyrics-editor-field">
            <label htmlFor="lyrics-source"><FileText /> Исходный текст</label>
            <p>Это оригинал. При запуске синхронизации изменения сохранятся автоматически.</p>
            <textarea id="lyrics-source" aria-label="Исходный текст" value={source} onChange={(event) => setSource(event.target.value)} placeholder={"Первая строка\nСледующая строка"} />
          </div>
          <div className="lyrics-editor-field">
            <label htmlFor="lyrics-lrc"><TimerReset /> Результат с таймкодами</label>
            <p>{reviewReady ? "Проверьте строки и поправьте таймкоды перед публикацией." : "Здесь появится результат автоматической синхронизации."}</p>
            <textarea id="lyrics-lrc" aria-label="Синхронизированный LRC" value={lrc} onChange={(event) => setLrc(event.target.value)} placeholder={"[00:12.400] Первая строка\n[00:17.820] Следующая строка"} />
          </div>
        </div>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <footer className="lyrics-footer">
          <button className="glass-button" onClick={onClose}>Закрыть</button>
          <div>
            <button
              className="glass-button"
              onClick={() => void align()}
              disabled={!alignmentAvailable || !source.trim() || status === "PROCESSING" || saving !== null}
              title={alignmentAvailable ? "Сохранить текст и построить таймкоды" : "Alignment engine не настроен на сервере"}
            >
              <Sparkles /> {status === "PROCESSING" || saving === "align" ? "Синхронизирую…" : sourceDirty ? "Сохранить и синхронизировать" : reviewReady ? "Синхронизировать заново" : "Синхронизировать"}
            </button>
            <button className="glass-button primary-action" onClick={() => void saveLrc()} disabled={!lrc.trim() || saving !== null || status === "PROCESSING"}>
              <Check /> {saving === "lrc" ? "Публикую…" : "Опубликовать lyrics"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
