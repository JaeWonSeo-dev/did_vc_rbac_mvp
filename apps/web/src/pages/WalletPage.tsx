import { useState } from "react";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";

export function WalletPage() {
  const { data, refresh } = useSummary();
  const [passphrase, setPassphrase] = useState('demo-passphrase');
  const [selectedDid, setSelectedDid] = useState('');
  const [vcJwt, setVcJwt] = useState('');
  const [requestJson, setRequestJson] = useState('');
  const [credentialJti, setCredentialJti] = useState('');
  const [vp, setVp] = useState<any>(null);
  return (
    <div>
      <h2>Wallet</h2>
      <input value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="passphrase" />
      <button onClick={async () => { const wallet = await api<any>('/api/wallets', { method: 'POST', body: JSON.stringify({ passphrase }) }); setSelectedDid(wallet.did); refresh(); }}>Create Holder DID</button>
      <div>
        <select value={selectedDid} onChange={(e) => setSelectedDid(e.target.value)}>
          <option value="">Select wallet</option>
          {data?.wallets?.map((w: any) => <option key={w.did} value={w.did}>{w.did}</option>)}
        </select>
      </div>
      <textarea placeholder="VC JWT" value={vcJwt} onChange={(e) => setVcJwt(e.target.value)} rows={5} style={{ width: '100%' }} />
      <button onClick={async () => { await api(`/api/wallets/${encodeURIComponent(selectedDid)}/import`, { method: 'POST', body: JSON.stringify({ passphrase, vcJwt }) }); refresh(); }}>Import VC</button>
      <h3>Presentation Request</h3>
      <textarea placeholder="auth request JSON" value={requestJson} onChange={(e) => setRequestJson(e.target.value)} rows={8} style={{ width: '100%' }} />
      <input placeholder="credential jti" value={credentialJti} onChange={(e) => setCredentialJti(e.target.value)} style={{ width: '100%' }} />
      <button onClick={async () => { const request = JSON.parse(requestJson); const result = await api(`/api/wallets/${encodeURIComponent(selectedDid)}/present`, { method: 'POST', body: JSON.stringify({ passphrase, credentialJti, request }) }); setVp(result); }}>Create VP</button>
      <pre>{JSON.stringify(vp, null, 2)}</pre>
      <h3>Wallet Credentials</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
