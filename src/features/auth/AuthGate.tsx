import { Music2, Server } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { authorizedFetch, getServerUrl, hasAccessToken, setAccessToken, setAuthTokens, setServerUrl } from "../../api";

type Capabilities = { initialized: boolean; mode?: "PERSONAL" | "FAMILY"; registrationEnabled: boolean };
type AuthPayload = { accessToken: string; refreshToken: string; user: { role: "OWNER" | "MEMBER"; displayName: string } };

export function AuthGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(hasAccessToken());
  const [server, setServer] = useState(getServerUrl());
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"PERSONAL" | "FAMILY">("PERSONAL");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    authorizedFetch(`${getServerUrl()}/api/auth/me`)
      .then((response) => { if (!response.ok) { setAccessToken(null); setAuthenticated(false); } });
  }, [authenticated]);

  useEffect(() => {
    const handleExpiredSession = () => setAuthenticated(false);
    window.addEventListener("openchord:auth-expired", handleExpiredSession);
    return () => window.removeEventListener("openchord:auth-expired", handleExpiredSession);
  }, []);

  if (authenticated) return children;

  const connect = async (event: FormEvent) => {
    event.preventDefault(); setWorking(true); setError("");
    try {
      const url = setServerUrl(server);
      const response = await fetch(`${url}/api/auth/server`);
      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      setServer(url); setCapabilities(await response.json() as Capabilities);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not reach server"); }
    finally { setWorking(false); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setWorking(true); setError("");
    try {
      const setup = !capabilities?.initialized;
      const response = await fetch(`${server}/api/auth/${setup ? "setup" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, password, deviceName: "OpenChord Studio", ...(setup ? { mode } : {}) }),
      });
      const body = await response.json() as AuthPayload & { message?: string };
      if (!response.ok) throw new Error(body.message || "Authentication failed");
      if (body.user.role !== "OWNER") throw new Error("Studio is available to the server owner only.");
      setAuthTokens(body.accessToken, body.refreshToken); setAuthenticated(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Authentication failed"); }
    finally { setWorking(false); }
  };

  return <main className="auth-page">
    <section className="auth-card glass">
      <div className="auth-brand"><span className="mark"><Music2 /></span><div><strong>OpenChord</strong><small>Studio</small></div></div>
      {!capabilities ? <form onSubmit={connect} className="auth-form">
        <div><span className="overline">Self-hosted music</span><h1>Connect to your server</h1><p>Enter the URL of the OpenChord server you manage.</p></div>
        <label className="field"><span>Server URL</span><input value={server} onChange={(event) => setServer(event.target.value)} autoFocus /></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="glass-button primary-action" disabled={working}><Server />{working ? "Connecting…" : "Continue"}</button>
      </form> : <form onSubmit={submit} className="auth-form">
        <button type="button" className="auth-back" onClick={() => setCapabilities(null)}>← Change server</button>
        <div><span className="overline">{capabilities.initialized ? "Owner access" : "First launch"}</span><h1>{capabilities.initialized ? "Sign in to Studio" : "Create the owner account"}</h1></div>
        {!capabilities.initialized && <>
          <div className="mode-picker"><button type="button" className={mode === "PERSONAL" ? "active" : ""} onClick={() => setMode("PERSONAL")}>Just me</button><button type="button" className={mode === "FAMILY" ? "active" : ""} onClick={() => setMode("FAMILY")}>Family</button></div>
          <label className="field"><span>Display name</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></label>
        </>}
        <label className="field"><span>Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} required autoCapitalize="none" /></label>
        <label className="field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} required /></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="glass-button primary-action" disabled={working}>{working ? "Please wait…" : capabilities.initialized ? "Sign In" : "Create Owner"}</button>
      </form>}
    </section>
  </main>;
}
