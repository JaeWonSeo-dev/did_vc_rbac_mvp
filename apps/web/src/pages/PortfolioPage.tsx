import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

export function PortfolioPage() {
  const { slug = "sjw-dev" } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api(`/api/portfolio/${slug}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  const credentialStatusSummary = useMemo(() => {
    if (!data?.credentials?.length) return [];
    const counts = new Map<string, number>();
    for (const credential of data.credentials) {
      counts.set(credential.status, (counts.get(credential.status) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [data]);

  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;
  if (!data) return <p>Loading portfolio…</p>;

  const { profile, github, projects, achievements, repositories, credentials, credentialRequests, verificationLogs } = data;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ padding: 24, borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }}>
        <p style={{ margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }}>Public portfolio</p>
        <h2 style={{ marginTop: 12, marginBottom: 8 }}>{profile.display_name}</h2>
        <p style={{ fontSize: 18, color: "#e2e8f0" }}>{profile.headline}</p>
        <p style={{ maxWidth: 900, color: "#cbd5e1" }}>{profile.bio}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 20 }}>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Verified identity</div>
            <div>{github?.username ? `@${github.username}` : "GitHub pending"}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{profile.location || "Location not set"}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Credential coverage</div>
            <div>{credentials.length} credentials</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{credentialStatusSummary.map(([status, count]) => `${count} ${status}`).join(" · ") || "No status data"}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>GitHub evidence</div>
            <div>{github?.contributionSummary?.repositoryCount ?? 0} repos</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{github?.contributionSummary?.evidenceNarrative || "No evidence narrative yet"}</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Non-GitHub evidence</div>
            <div>{achievements.length} achievements</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Awards, completions, certifications, and manual proof</div>
          </div>
        </div>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Featured projects</h3>
            <p style={{ color: "#94a3b8" }}>Narrative-first cards with verifiable evidence underneath.</p>
          </div>
          <Link to="/">Back to dashboard</Link>
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          {projects.map((project: any) => (
            <div key={project.id} style={{ padding: 18, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <strong style={{ fontSize: 18 }}>{project.name}</strong>
                  {project.featured ? <span style={{ marginLeft: 10, color: "#4ade80" }}>Featured</span> : null}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {project.repo_url ? <a href={project.repo_url} target="_blank" rel="noreferrer">Repository</a> : null}
                  {project.live_url ? <a href={project.live_url} target="_blank" rel="noreferrer">Live</a> : null}
                </div>
              </div>
              <p>{project.description}</p>
              {project.highlights?.length ? <ul>{project.highlights.map((item: string) => <li key={item}>{item}</li>)}</ul> : null}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Awards, completions, and manual achievements</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {achievements.map((achievement: any) => (
            <div key={achievement.id} style={{ padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <strong>{achievement.title}</strong>
                <span style={{ color: "#93c5fd" }}>{achievement.category}</span>
              </div>
              <p>{achievement.description}</p>
              <ul>
                <li>Issuer: {achievement.issuer_name || "self-attested / manual evidence"}</li>
                <li>Issued on: {achievement.issued_on || "n/a"}</li>
                {achievement.credential_url ? <li><a href={achievement.credential_url} target="_blank" rel="noreferrer">Open proof link</a></li> : null}
              </ul>
              {achievement.evidence?.length ? <ul>{achievement.evidence.map((item: string) => <li key={item}>{item}</li>)}</ul> : null}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>GitHub evidence snapshot</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {repositories.map((repo: any) => (
            <div key={repo.id} style={{ padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <strong>{repo.full_name}</strong>
                <a href={repo.repo_url} target="_blank" rel="noreferrer">Open repository</a>
              </div>
              <p>{repo.description}</p>
              <ul>
                <li>Role: {repo.contribution_role}</li>
                <li>Language: {repo.language || "n/a"}</li>
                <li>Stars: {repo.stargazers_count}</li>
                <li>Observed contributions: {repo.estimated_contribution_count}</li>
                <li>Observed merged PRs: {repo.estimated_merged_pr_count}</li>
                <li>Evidence confidence: {repo.summary?.confidence || "heuristic"}</li>
                <li>Activity window: {repo.summary?.activityWindow?.start || "n/a"} → {repo.summary?.activityWindow?.end || "n/a"}</li>
              </ul>
              {repo.summary?.proofSummary ? <p style={{ color: "#cbd5e1" }}>{repo.summary.proofSummary}</p> : null}
              {repo.summary?.proofPoints?.length ? <ul>{repo.summary.proofPoints.map((item: string) => <li key={item}>{item}</li>)}</ul> : null}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Credential requests and issuer decisions</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {credentialRequests.map((request: any) => (
            <div key={request.id} style={{ padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{request.request_type}</strong>
                <span style={{ color: request.status === "approved" ? "#4ade80" : request.status === "rejected" ? "#fca5a5" : "#fbbf24" }}>{request.status}</span>
              </div>
              <p>{request.target_name || "General evidence request"}</p>
              {request.reviewer_note ? <p style={{ color: "#cbd5e1" }}>Issuer note: {request.reviewer_note}</p> : <p style={{ color: "#94a3b8" }}>Awaiting issuer/admin review.</p>}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Verifiable credentials</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {credentials.map((credential: any) => (
            <div key={credential.credential_jti} style={{ padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{credential.credential_type}</strong>
                <span style={{ color: credential.status === "active" ? "#4ade80" : credential.status === "revoked" ? "#fca5a5" : "#fbbf24" }}>{credential.status}</span>
              </div>
              <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(credential.summary, null, 2)}</pre>
              <Link to={`/verify/${credential.credential_jti}`}>Open recruiter verification</Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Recent recruiter verification activity</h3>
        {verificationLogs.length ? (
          <ul>
            {verificationLogs.map((log: any) => (
              <li key={log.id}>{new Date(log.created_at).toLocaleString()} · {log.result} · {log.reason}</li>
            ))}
          </ul>
        ) : <p>No recruiter verification checks yet.</p>}
      </section>
    </div>
  );
}
