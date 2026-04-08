import { useState } from "react";
import { api } from "../lib/api";

export function VerifierPage() {
  const [targetPath, setTargetPath] = useState('/admin');
  const [authRequest, setAuthRequest] = useState<any>(null);
  const [vpToken, setVpToken] = useState('');
  const [result, setResult] = useState<any>(null);
  return (
    <div>
      <h2>Verifier</h2>
      <select value={targetPath} onChange={(e) => setTargetPath(e.target.value)}>
        <option>/admin</option><option>/audit</option><option>/dev</option>
      </select>
      <button onClick={async () => setAuthRequest(await api('/api/verifier/request', { method: 'POST', body: JSON.stringify({ targetPath }) }))}>Start Login</button>
      <pre>{JSON.stringify(authRequest, null, 2)}</pre>
      <textarea placeholder="VP JWT" value={vpToken} onChange={(e) => setVpToken(e.target.value)} rows={8} style={{ width: '100%' }} />
      <button onClick={async () => { if (!authRequest) return; try { setResult(await api('/api/verifier/direct-post', { method: 'POST', body: JSON.stringify({ vp_token: vpToken, state: authRequest.state }) })); } catch (e: any) { setResult({ error: e.message }); } }}>Submit VP</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
