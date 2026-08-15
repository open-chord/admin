import { Check, FileText, TimerReset, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchLyrics, updateLyrics, updateLyricsSource } from "../../api";
import type { LyricLine, LyricsStatus, Track } from "../../types";

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
  const [lrc, setLrc] = useState("");
  const [status, setStatus] = useState<LyricsStatus>("EMPTY");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"source" | "lrc" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchLyrics(track.id)
      .then((document) => {
        if (cancelled) return;
        setSource(document.sourceText);
        setLrc(linesAsLrc(document.lines));
        setStatus(document.status);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Не удалось загрузить lyrics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [track.id]);

  const saveSource = async () => {
    setSaving("source");
    setError(null);
    try {
      const document = await updateLyricsSource(track.id, source);
      setStatus(document.status);
      setLrc("");
      onSaved({ ...track, lyricLines: 0 });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить исходный текст");
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

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="lyrics-sheet glass" onMouseDown={(event) => event.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть"><X /></button>
        <span className="overline">Синхронизация</span>
        <h2>{track.title}</h2>
        <p className={`lyrics-status lyrics-status-${status.toLowerCase()}`}>{statusLabel[status]}</p>
        {loading ? <p>Загружаю lyrics…</p> : <div className="lyrics-editor-grid">
          <label className="lyrics-editor-field">
            <span><FileText /> Исходный текст</span>
            <textarea aria-label="Исходный текст" value={source} onChange={(event) => setSource(event.target.value)} placeholder={"Первая строка\nСледующая строка"} />
            <button className="glass-button" onClick={() => void saveSource()} disabled={saving !== null}><Check /> {saving === "source" ? "Сохраняю…" : "Сохранить исходник"}</button>
          </label>
          <label className="lyrics-editor-field">
            <span><TimerReset /> Синхронизированный LRC</span>
            <textarea aria-label="Синхронизированный LRC" value={lrc} onChange={(event) => setLrc(event.target.value)} placeholder={"[00:12.400] Первая строка\n[00:17.820] Следующая строка"} />
            <button className="glass-button primary-action" onClick={() => void saveLrc()} disabled={saving !== null}><Check /> {saving === "lrc" ? "Сохраняю…" : "Сохранить таймкоды"}</button>
          </label>
        </div>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <footer><button className="glass-button" onClick={onClose}>Закрыть</button></footer>
      </section>
    </div>
  );
}
