import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

function fmtDate(seconds?: number | null) {
  if (!seconds) return "No expiry";
  return new Date(seconds * 1000).toLocaleString();
}

function toTitle(value?: string | null) {
  return String(value ?? "").replace(/([a-z])([A-Z])/g, "$1 $2");
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
    if (!data?.expiresAt) return { label: "No expiry", color: "#4ade80", summary: "This credential does not currently carry an expiration date." };
    return data.expiresAt * 1000 > Date.now()
      ? { label: "Not expired", color: "#4ade80", summary: "The credential is still within its declared validity window." }
      : { label: "Expired", color: "#fca5a5", summary: "The credential has passed its expiry date and should be re-issued before relying on it." };
  }, [data]);

  const decision = useMemo(() => {
    if (!data?.ok) {
      return {
        label: "Do not trust",
        color: "#fca5a5",
        background: "rgba(127, 29, 29, 0.35)",
        summary: "Signature verification failed or the credential could not be resolved from the issuer registry."
      };
    }
    if (data.status === "revoked") {
      return {
        label: "Invalidated by issuer",
        color: "#fca5a5",
        background: "rgba(127, 29, 29, 0.35)",
        summary: "The issuer revoked this credential. Recruiters should not rely on it as current proof."
      };
    }
    if (data.status === "suspended") {
      return {
        label: "Temporarily on hold",
        color: "#fbbf24",
        background: "rgba(120, 53, 15, 0.35)",
        summary: "The issuer temporarily suspended this credential pending review or clarification."
      };
    }
    if (data.expiresAt && data.expiresAt * 1000 <= Date.now()) {
      return {
        label: "Expired credential",
        color: "#fca5a5",
        background: "rgba(127, 29, 29, 0.35)",
        summary: "The signature is valid, but the credential is outside its validity period."
      };
    }
    return {
      label: "Verified and active",
      color: "#4ade80",
      background: "rgba(20, 83, 45, 0.35)",
      summary: "The signature is valid, the issuer registry marks it active, and the credential is still in date."
    };
  }, [data]);

  const summaryEntries = useMemo(() => {
    if (!data?.summary || typeof data.summary !== "object") return [];
    return Object.entries(data.summary);
  }, [data]);

  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;
  if (!data) return <p>Verifying credential…</p>;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ padding: 24, borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }}>
        <p style={{ margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }}>Recruiter verification</p>
        <h2 style={{ marginTop: 12, marginBottom: 12 }}>Credential verification result</h2>

        <div style={{ padding: 18, borderRadius: 18, background: decision.background, border: `1px solid ${decision.color}` }}>
          <div style={{ fontSize: 12, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 1.2 }}>Decision</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: decision.color, marginTop: 6 }}>{decision.label}</div>
          <p style={{ marginBottom: 0, color: "#e2e8f0" }}>{decision.summary}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>Signature</div>
            <div style={{ color: data.ok ? "#4ade80" : "#fca5a5", fontWeight: 700 }}>{data.ok ? "Verified" : "Invalid"}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>Registry status</div>
            <div style={{ color: data.status === "active" ? "#4ade80" : data.status === "revoked" ? "#fca5a5" : "#fbbf24", fontWeight: 700 }}>{data.status}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{data.statusExplainer}</div>
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

        <div style={{ marginTop: 18, padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>How to read this page</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1" }}>
            <li><strong>Signature:</strong> proves the credential payload was signed by the issuer DID.</li>
            <li><strong>Registry status:</strong> shows whether the issuer still considers the credential active.</li>
            <li><strong>Expiry:</strong> tells you whether the credential is still within its declared validity window.</li>
            <li><strong>Decision:</strong> combines signature, registry state, and expiry into one recruiter-facing judgment.</li>
          </ul>
        </div>

        <ul style={{ marginTop: 18 }}>
          <li>Credential type: {data.credentialType}</li>
          <li>Subject DID: {data.subjectDid}</li>
          <li>Portfolio: {data.portfolioSlug ? <Link to={`/portfolio/${data.portfolioSlug}`}>{data.portfolioSlug}</Link> : "n/a"}</li>
          <li>Expiry meaning: {expiryState.summary}</li>
        </ul>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Recruiter-readable summary</h3>
        {data.summary?.narrative ? (
          <div style={{ marginBottom: 14, padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f", color: "#e2e8f0" }}>
            {data.summary.narrative}
          </div>
        ) : null}
        {summaryEntries.length ? (
          <div style={{ display: "grid", gap: 12 }}>
            {summaryEntries.map(([key, value]) => (
              <div key={key} style={{ padding: 14, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }}>
                <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }}>{toTitle(key)}</div>
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}</div>
              </div>
            ))}
          </div>
        ) : <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.summary, null, 2)}</pre>}
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Verified claims</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.claims, null, 2)}</pre>
      </section>
    </div>
  );
}
