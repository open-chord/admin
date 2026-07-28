import { Check, X } from "lucide-react";
import { useState } from "react";
import { updateLyrics } from "../../api";
import type { Track } from "../../types";

export function LyricsSheet({
  track,
  onClose,
  onSaved,
}: {
  track: Track;
  onClose: () => void;
  onSaved: (track: Track) => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      onSaved(await updateLyrics(track.id, value));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="lyrics-sheet glass" onMouseDown={(event) => event.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Закрыть"><X /></button>
        <span className="overline">Синхронизация</span>
        <h2>{track.title}</h2>
        <p>Каждая строка начинается с таймкода <code>[01:24.50]</code></p>
        <textarea autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder={"[00:00.00] Первая строка\n[00:05.20] Следующая строка"} />
        <footer>
          <button className="glass-button" onClick={onClose}>Отмена</button>
          <button className="glass-button primary-action" onClick={() => void save()} disabled={saving}><Check /> {saving ? "Сохраняю…" : "Сохранить lyrics"}</button>
        </footer>
      </section>
    </div>
  );
}
