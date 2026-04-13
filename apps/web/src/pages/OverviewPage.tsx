import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";

export function OverviewPage() {
  const { data, error, refresh } = useSummary();
  const portfolio = data?.portfolio;
  const firstCredential = portfolio?.credentials?.[0];
  const userId = portfolio?.profile?.id;

  const startGitHubOAuth = async () => {
    if (!userId) return;
    const result = await api<{ authorizeUrl: string }>("/api/github/oauth/start", {
      method: "POST",
      body: JSON.stringify({ userId })
    });
    window.location.href = result.authorizeUrl;
  };

  const syncGitHub = async () => {
    if (!userId) return;
    await api(`/api/github/sync/${userId}`, { method: "POST" });
    await refresh();
  };

  const issuePortfolioCredentials = async () => {
    if (!userId) return;
    await api(`/api/portfolio/${userId}/credentials/issue`, { method: "POST", body: JSON.stringify({}) });
    await refresh();
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section style={{ padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }}>
        <h2 style={{ marginTop: 0 }}>Verifiable developer portfolio dashboard</h2>
        <p>
          This MVP now supports GitHub OAuth bootstrap, GitHub API sync for profile and repositories, persisted portfolio evidence, and issuance of the two portfolio VC types.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={refresh}>Refresh API summary</button>
          {userId ? <button onClick={() => void startGitHubOAuth()}>Connect GitHub</button> : null}
          {userId ? <button onClick={() => void syncGitHub()}>Sync GitHub evidence</button> : null}
          {userId ? <button onClick={() => void issuePortfolioCredentials()}>Issue portfolio credentials</button> : null}
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
            <li>Repositories synced: {portfolio.repositories?.length ?? 0}</li>
            <li>Projects: {portfolio.projects?.length ?? 0}</li>
            <li>Credentials: {portfolio.credentials?.length ?? 0}</li>
          </ul>
        </section>
      ) : null}
    </div>
  );
}
