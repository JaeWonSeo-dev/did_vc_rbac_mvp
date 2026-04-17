import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

function statusBadge(status: string) {
  if (status === "active") return { color: "#4ade80", label: "Active" };
  if (status === "revoked") return { color: "#fca5a5", label: "Revoked" };
  if (status === "suspended") return { color: "#fbbf24", label: "Suspended" };
  return { color: "#cbd5e1", label: status };
}

function summaryItem(label: string, value: any) {
  if (value === undefined || value === null || value === "") return null;
  return <div style={{ color: "#94a3b8" }}><strong style={{ color: "#cbd5e1" }}>{label}:</strong> {String(value)}</div>;
}

function trustChecklist(data: any) {
  const githubConnected = Boolean(data?.github?.username);
  const credentialCount = data?.credentials?.length ?? 0;
  const activeCredentialCount = (data?.credentials ?? []).filter((credential: any) => credential.status === "active").length;
  const manualEvidenceCount = data?.achievements?.length ?? 0;
  const projectCount = data?.projects?.length ?? 0;

  return [
    {
      title: "Identity and portfolio owner",
      detail: githubConnected ? `Connected GitHub account: @${data.github.username}` : "GitHub account not connected in this view."
    },
    {
      title: "Project narrative and supporting evidence",
      detail: `${projectCount} featured project(s) and ${manualEvidenceCount} non-GitHub achievement(s) are published.`
    },
    {
      title: "Issuer-reviewed credentials",
      detail: `${credentialCount} credential(s) published, ${activeCredentialCount} currently active in issuer registry.`
    }
  ];
}

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

  const recruiterChecklist = useMemo(() => trustChecklist(data), [data]);

  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;
  if (!data) return <p>Loading portfolio…</p>;

  const { profile, github, projects, achievements, repositories, credentials, credentialRequests, verificationLogs } = data;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ padding: 24, borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }}>
        <p style={{ margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }}>Public portfolio</p>
        <h2 style={{ marginTop: 12, marginBottom: 8 }}>{profile.display_name}</h2>
        <p style={{ fontSize: 18, color: "#e2e8f0" }}>{profile.headline}</p>
        <p style={{ maxWidth: 900, color: "#cbd5e1", marginBottom: 16 }}>{profile.bio}</p>
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(11, 16, 32, 0.9)", border: "1px solid #24324f", color: "#cbd5e1", maxWidth: 920 }}>
          This page is meant to be recruiter-readable first: featured work, supporting evidence, issued credentials, and verification links appear in one place.
        </div>
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
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h3 style={{ marginTop: 0 }}>Why a recruiter can trust this portfolio</h3>
              <p style={{ color: "#94a3b8" }}>This portfolio combines identity context, evidence, and issuer-reviewed credentials instead of showing claims alone.</p>
            </div>
            <Link to="/">Back to dashboard</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {recruiterChecklist.map((item) => (
              <div key={item.title} style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
                <div style={{ fontSize: 12, color: "#93c5fd", textTransform: "uppercase" }}>{item.title}</div>
                <div style={{ marginTop: 8, color: "#e2e8f0" }}>{item.detail}</div>
              </div>
            ))}
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
          {!projects.length ? <div style={{ padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }}>No featured projects are published yet.</div> : null}
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
          {!achievements.length ? <div style={{ padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }}>No awards, completions, or manual achievements have been published yet.</div> : null}
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
        <p style={{ color: "#94a3b8" }}>Repository cards below summarize what was actually inspected during sync: contributions, merged PRs, contributor context, and confidence level.</p>
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
                <li>Inspected closed PRs: {repo.summary?.pullRequestCount ?? "n/a"}</li>
                <li>Observed contributors: {repo.summary?.contributorCount ?? "n/a"}</li>
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
          {!credentialRequests.length ? <div style={{ padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }}>No credential review requests are visible yet. The intended flow is: gather evidence, submit a request, let an issuer review it, then publish the issued credential here.</div> : null}
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
        <p style={{ color: "#94a3b8" }}>Each credential can be opened in a recruiter-facing verification page with signature, registry status, and expiry context.</p>
        {!credentials.length ? <div style={{ padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }}>No issued credentials have been published yet.</div> : null}
        <div style={{ display: "grid", gap: 16 }}>
          {credentials.map((credential: any) => {
            const badge = statusBadge(credential.status);
            return (
              <div key={credential.credential_jti} style={{ padding: 16, borderRadius: 12, background: "#0b1020", border: `1px solid ${badge.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <strong>{credential.credential_type}</strong>
                    {credential.summary?.title ? <div style={{ color: "#93c5fd", marginTop: 6 }}>{credential.summary.title}</div> : null}
                  </div>
                  <span style={{ color: badge.color, fontWeight: 700 }}>{badge.label}</span>
                </div>
                {credential.status !== "active" ? (
                  <p style={{ color: badge.color, marginBottom: 8 }}>
                    {credential.status === "revoked"
                      ? "Issuer registry marks this credential as revoked."
                      : "Issuer registry marks this credential as temporarily suspended."}
                  </p>
                ) : null}
                {credential.summary?.narrative ? <p style={{ color: "#e2e8f0" }}>{credential.summary.narrative}</p> : null}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
                  {summaryItem("Repository", credential.summary?.repository)}
                  {summaryItem("Role", credential.summary?.role)}
                  {summaryItem("Commits", credential.summary?.commitCount)}
                  {summaryItem("Merged PRs", credential.summary?.mergedPrCount)}
                  {summaryItem("Category", credential.summary?.category)}
                  {summaryItem("Issuer", credential.summary?.issuerName)}
                  {summaryItem("Issued on", credential.summary?.issuedOn)}
                </div>
                <details>
                  <summary style={{ cursor: "pointer", color: "#94a3b8" }}>Show raw summary JSON</summary>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(credential.summary, null, 2)}</pre>
                </details>
                <div style={{ marginTop: 12 }}>
                  <Link to={`/verify/${credential.credential_jti}`}>Open recruiter verification</Link>
                </div>
              </div>
            );
          })}
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
