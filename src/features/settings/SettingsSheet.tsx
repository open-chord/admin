import { Server, X } from "lucide-react";
import { useState } from "react";
import { getServerUrl, setServerUrl, testServerConnection } from "../../api";

export function SettingsSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [url, setUrl] = useState(getServerUrl());
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [testing, setTesting] = useState(false);

  const test = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await testServerConnection(url);
      setStatus({ text: "Connection successful" });
    } catch {
      setStatus({ text: "Connection failed. A remote origin also requires backend CORS support (TODO).", error: true });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    setStatus(null);
    try {
      setServerUrl(url);
      onSaved();
    } catch {
      setStatus({ text: "Enter a valid server URL.", error: true });
    }
  };

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="settings-sheet glass" onMouseDown={(event) => event.stopPropagation()}>
        <button className="sheet-close" onClick={onClose} aria-label="Close settings"><X /></button>
        <span className="settings-icon"><Server /></span>
        <span className="overline">Connection</span>
        <h2>OpenChord Server</h2>
        <p>Choose the server managed by this Studio installation.</p>
        <label className="field">
          <span>Server URL</span>
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder={window.location.origin} />
        </label>
        <div className="cors-note">
          <strong>Remote connections</strong>
          <span>Cross-origin servers require configurable CORS support in OpenChord Server. That backend work remains TODO.</span>
        </div>
        {status && <p className={`connection-result ${status.error ? "error" : ""}`}>{status.text}</p>}
        <footer>
          <button className="toolbar-button" disabled={testing} onClick={() => void test()}>{testing ? "Testing…" : "Test Connection"}</button>
          <button className="toolbar-button primary" onClick={save}>Save</button>
        </footer>
      </section>
    </div>
  );
}
