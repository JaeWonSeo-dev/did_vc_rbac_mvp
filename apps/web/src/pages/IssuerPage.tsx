import { useState } from "react";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";

export function IssuerPage() {
  const { data, refresh } = useSummary();
  const [subjectDid, setSubjectDid] = useState('');
  const [role, setRole] = useState('Admin');
  const [expiresInSeconds, setExpiresInSeconds] = useState(3600);
  const [issued, setIssued] = useState<any>(null);

  return (
    <div>
      <h2>Issuer</h2>
      <input placeholder="subject DID" value={subjectDid} onChange={(e) => setSubjectDid(e.target.value)} style={{ width: 500 }} />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option>Admin</option><option>Auditor</option><option>Developer</option>
      </select>
      <input type="number" value={expiresInSeconds} onChange={(e) => setExpiresInSeconds(Number(e.target.value))} />
      <button onClick={async () => { const res = await api('/api/issuer/credentials', { method: 'POST', body: JSON.stringify({ subjectDid, role, expiresInSeconds }) }); setIssued(res); refresh(); }}>Issue VC</button>
      <pre>{JSON.stringify(issued, null, 2)}</pre>
      <h3>Issued Credentials</h3>
      {data?.credentials?.map((item: any) => (
        <div key={item.jti} style={{ border: '1px solid #334155', padding: 12, marginBottom: 8 }}>
          <div>{item.role} / {item.subject_did}</div>
          <div>Status: {item.status}</div>
          <button onClick={async () => { await api(`/api/issuer/credentials/${item.jti}/status`, { method: 'POST', body: JSON.stringify({ status: 'suspended', reason: 'manual suspend' }) }); refresh(); }}>Suspend</button>
          <button onClick={async () => { await api(`/api/issuer/credentials/${item.jti}/status`, { method: 'POST', body: JSON.stringify({ status: 'revoked', reason: 'manual revoke' }) }); refresh(); }}>Revoke</button>
        </div>
      ))}
    </div>
  );
}
