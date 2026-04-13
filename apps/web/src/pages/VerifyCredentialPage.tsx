import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

export function VerifyCredentialPage() {
  const { jti = "demo" } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api(`/api/verify/${jti}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [jti]);

  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;
  if (!data) return <p>Verifying credential…</p>;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }}>
        <h2 style={{ marginTop: 0 }}>Recruiter verification result</h2>
        <p>Status: <strong style={{ color: data.ok ? "#4ade80" : "#fca5a5" }}>{data.ok ? "valid" : "invalid"}</strong></p>
        <ul>
          <li>Credential type: {data.credentialType}</li>
          <li>Issuer DID: {data.issuerDid}</li>
          <li>Subject DID: {data.subjectDid}</li>
          <li>Registry status: {data.status}</li>
          <li>Portfolio: {data.portfolioSlug ? <Link to={`/portfolio/${data.portfolioSlug}`}>{data.portfolioSlug}</Link> : "n/a"}</li>
        </ul>
      </section>

      <section style={{ padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Credential summary</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.summary, null, 2)}</pre>
      </section>

      <section style={{ padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Verified claims</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.claims, null, 2)}</pre>
      </section>
    </div>
  );
}
