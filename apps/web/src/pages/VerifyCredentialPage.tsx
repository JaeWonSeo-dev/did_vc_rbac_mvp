import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

function fmtDate(seconds?: number | null) {
  if (!seconds) return "No expiry";
  return new Date(seconds * 1000).toLocaleString();
}

export function VerifyCredentialPage() {
  const { jti = "demo" } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api(`/api/verify/${jti}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [jti]);

  const expiryState = useMemo(() => {
    if (!data?.expiresAt) return { label: "No expiry", color: "#4ade80" };
    return data.expiresAt * 1000 > Date.now()
      ? { label: "Not expired", color: "#4ade80" }
      : { label: "Expired", color: "#fca5a5" };
  }, [data]);

  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;
  if (!data) return <p>Verifying credential…</p>;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ padding: 24, borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }}>
        <p style={{ margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }}>Recruiter verification</p>
        <h2 style={{ marginTop: 12, marginBottom: 12 }}>Credential verification result</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>Signature</div>
            <div style={{ color: data.ok ? "#4ade80" : "#fca5a5", fontWeight: 700 }}>{data.ok ? "Verified" : "Invalid"}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>Registry status</div>
            <div style={{ color: data.status === "active" ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>{data.status}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>Expiry</div>
            <div style={{ color: expiryState.color, fontWeight: 700 }}>{expiryState.label}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{fmtDate(data.expiresAt)}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>Issuer</div>
            <div style={{ fontWeight: 700 }}>{data.issuerDid}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{data.credentialType}</div>
          </div>
        </div>
        <ul style={{ marginTop: 18 }}>
          <li>Credential type: {data.credentialType}</li>
          <li>Subject DID: {data.subjectDid}</li>
          <li>Portfolio: {data.portfolioSlug ? <Link to={`/portfolio/${data.portfolioSlug}`}>{data.portfolioSlug}</Link> : "n/a"}</li>
        </ul>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Recruiter-readable summary</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.summary, null, 2)}</pre>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Verified claims</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.claims, null, 2)}</pre>
      </section>
    </div>
  );
}
