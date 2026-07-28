import { FileAudio, ImagePlus, Music2, Sparkles, Upload, X } from "lucide-react";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { uploadTrack } from "../../api";
import { Field } from "../../shared/Field";
import { formatDuration } from "../../shared/format";
import type { Album, Track } from "../../types";
import { DropField } from "./DropField";

export function TrackUploadSheet({
  defaults,
  onCancel,
  onUploaded,
}: {
  defaults?: Album;
  onCancel: () => void;
  onUploaded: (track: Track) => void;
}) {
  const [audio, setAudio] = useState<File | null>(null);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLInputElement>(null);
  const artworkRef = useRef<HTMLInputElement>(null);
  const artworkUrl = useMemo(() => artwork ? URL.createObjectURL(artwork) : "", [artwork]);

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
    <div className="sheet-backdrop workflow-backdrop" onMouseDown={onCancel}>
      <form className="upload-card workflow-sheet glass" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onCancel} aria-label="Закрыть"><X /></button>
        <div className="upload-lead">
          <span className="upload-symbol"><Music2 /></span>
          <div><span className="overline">Новая музыка</span><h2>Соберём релиз.</h2><p>Аудио, метаданные, обложка и lyrics — всё сразу попадёт в OpenChord.</p></div>
        </div>
        <div className="upload-layout">
          <div className="form-stack">
            <DropField
              icon={<FileAudio />}
              title={audio?.name ?? "Перетащи аудиофайл"}
              hint={audio ? `${(audio.size / 1024 / 1024).toFixed(1)} МБ${durationMs ? ` · ${formatDuration(durationMs)}` : " · читаю файл…"}` : "MP3, M4A, AAC, WAV или FLAC"}
              onClick={() => audioRef.current?.click()}
              onDrop={chooseAudio}
            />
            <input ref={audioRef} className="hidden-input" type="file" accept="audio/*" onChange={(event) => chooseAudio(event.target.files?.[0])} />
            <div className="field-pair">
              <Field name="artist" label="Исполнитель" placeholder="Deftones" defaultValue={defaults?.artist} required />
              <Field name="album" label="Альбом" placeholder="Diamond Eyes" defaultValue={defaults?.title} required />
            </div>
            <Field name="title" label="Название трека" placeholder="Sextape" required />
            <div className="field-triplet">
              <Field name="releaseYear" label="Год" type="number" defaultValue={String(defaults?.year ?? 2026)} required />
              <Field name="discNumber" label="Диск" type="number" defaultValue="1" required />
              <Field name="trackNumber" label="Номер" type="number" defaultValue={String(defaults ? Math.max(0, ...defaults.tracks.map((track) => track.number)) + 1 : 1)} required />
            </div>
          </div>
          <div className="form-stack secondary-column">
            <button className="artwork-picker" type="button" onClick={() => artworkRef.current?.click()}>
              {artwork ? <img src={artworkUrl} alt="Выбранная обложка" /> : <><ImagePlus /><strong>Добавить обложку</strong><small>Квадрат, желательно от 1000 px</small></>}
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
    </div>
  );
}
