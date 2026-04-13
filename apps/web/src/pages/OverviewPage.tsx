import { Link } from "react-router-dom";
import { useSummary } from "../hooks/useSummary";

export function OverviewPage() {
  const { data, error, refresh } = useSummary();
  const portfolio = data?.portfolio;
  const firstCredential = portfolio?.credentials?.[0];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section style={{ padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }}>
        <h2 style={{ marginTop: 0 }}>P0 direction reset</h2>
        <p>
          The repo is no longer being treated as an admin-login product. P0 now focuses on a user/profile model, GitHub OAuth skeleton, portfolio credential schemas,
          a public portfolio page, and a recruiter verification page.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={refresh}>Refresh API summary</button>
          <Link to="/portfolio/sjw-dev">Open demo portfolio</Link>
          {firstCredential ? <Link to={`/verify/${firstCredential.credential_jti}`}>Open recruiter verification</Link> : null}
        </div>
      </section>

      <section style={{ padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }}>
        <h3 style={{ marginTop: 0 }}>Live summary</h3>
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      </section>

      {portfolio ? (
        <section style={{ padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }}>
          <h3 style={{ marginTop: 0 }}>Demo portfolio snapshot</h3>
          <p><strong>{portfolio.profile.display_name}</strong> · {portfolio.profile.headline}</p>
          <p>{portfolio.profile.bio}</p>
          <ul>
            <li>GitHub: {portfolio.github?.username ?? "not linked"}</li>
            <li>Projects: {portfolio.projects?.length ?? 0}</li>
            <li>Credentials: {portfolio.credentials?.length ?? 0}</li>
          </ul>
        </section>
      ) : null}
    </div>
  );
}
