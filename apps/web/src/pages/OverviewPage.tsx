import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";

type ProjectDraft = {
  name: string;
  description: string;
  repoUrl: string;
  liveUrl: string;
  highlightsText: string;
  featured: boolean;
};

type AchievementDraft = {
  title: string;
  category: string;
  issuerName: string;
  issuedOn: string;
  credentialUrl: string;
  description: string;
  evidenceText: string;
  featured: boolean;
};

type RequestDraft = {
  requestType: string;
  targetName: string;
  targetUrl: string;
  role: string;
  commitCount: string;
  mergedPrCount: string;
  periodStart: string;
  periodEnd: string;
  evidenceSummary: string;
  evidenceOrigin: string;
};

function toProjectDraft(project: any): ProjectDraft {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    repoUrl: project?.repo_url ?? "",
    liveUrl: project?.live_url ?? "",
    highlightsText: Array.isArray(project?.highlights) ? project.highlights.join("\n") : "",
    featured: Boolean(project?.featured)
  };
}

function toAchievementDraft(achievement: any): AchievementDraft {
  return {
    title: achievement?.title ?? "",
    category: achievement?.category ?? "award",
    issuerName: achievement?.issuer_name ?? "",
    issuedOn: achievement?.issued_on ?? "",
    credentialUrl: achievement?.credential_url ?? "",
    description: achievement?.description ?? "",
    evidenceText: Array.isArray(achievement?.evidence) ? achievement.evidence.join("\n") : "",
    featured: Boolean(achievement?.featured)
  };
}

const emptyRequestDraft = (): RequestDraft => ({
  requestType: "GitHubContributionCredential",
  targetName: "",
  targetUrl: "",
  role: "core contributor",
  commitCount: "",
  mergedPrCount: "",
  periodStart: "",
  periodEnd: "",
  evidenceSummary: "",
  evidenceOrigin: "github"
});

const githubRequestTemplate = (): RequestDraft => ({
  requestType: "GitHubContributionCredential",
  targetName: "",
  targetUrl: "",
  role: "core contributor",
  commitCount: "",
  mergedPrCount: "",
  periodStart: "",
  periodEnd: "",
  evidenceSummary: "Summarize the repository work, what was reviewed, and why it should become a credential.",
  evidenceOrigin: "github"
});

const achievementRequestTemplate = (): RequestDraft => ({
  requestType: "PortfolioAchievementCredential",
  targetName: "",
  targetUrl: "",
  role: "achievement holder",
  commitCount: "",
  mergedPrCount: "",
  periodStart: "",
  periodEnd: "",
  evidenceSummary: "Summarize the award, completion, or external evidence the issuer should verify.",
  evidenceOrigin: "manual"
});

function prettyLabel(label: string) {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (value) => value.toUpperCase());
}

export function OverviewPage() {
  const { data, error, refresh } = useSummary();
  const portfolio = data?.portfolio;
  const requests = data?.requests ?? [];
  const firstCredential = portfolio?.credentials?.[0];
  const userId = portfolio?.profile?.id;
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({ displayName: "", headline: "", location: "", portfolioSlug: "", bio: "" });
  const [projects, setProjects] = useState<ProjectDraft[]>([]);
  const [achievements, setAchievements] = useState<AchievementDraft[]>([]);
  const [requestDraft, setRequestDraft] = useState<RequestDraft>(emptyRequestDraft());

  useEffect(() => {
    if (!portfolio?.profile) return;
    setProfileForm({
      displayName: portfolio.profile.display_name ?? "",
      headline: portfolio.profile.headline ?? "",
      location: portfolio.profile.location ?? "",
      portfolioSlug: portfolio.profile.portfolio_slug ?? "",
      bio: portfolio.profile.bio ?? ""
    });
    setProjects((portfolio.projects ?? []).map(toProjectDraft));
    setAchievements((portfolio.achievements ?? []).map(toAchievementDraft));
  }, [portfolio]);

  const stats = useMemo(() => ({
    repositories: portfolio?.repositories?.length ?? 0,
    projects: portfolio?.projects?.length ?? 0,
    achievements: portfolio?.achievements?.length ?? 0,
    credentials: portfolio?.credentials?.length ?? 0,
    pendingRequests: requests.filter((item: any) => item.status === "pending").length,
    verifications: portfolio?.verificationLogs?.length ?? 0
  }), [portfolio, requests]);

  const onboardingSteps = useMemo(() => {
    const profileReady = Boolean(portfolio?.profile?.display_name && portfolio?.profile?.headline && portfolio?.profile?.bio);
    const githubReady = (portfolio?.repositories?.length ?? 0) > 0;
    const evidenceReady = (portfolio?.projects?.length ?? 0) > 0 || (portfolio?.achievements?.length ?? 0) > 0;
    const requestReady = requests.length > 0;
    const credentialReady = (portfolio?.credentials?.length ?? 0) > 0;
    const verificationReady = (portfolio?.verificationLogs?.length ?? 0) > 0;

    return [
      {
        title: "Complete profile story",
        done: profileReady,
        hint: "Add name, headline, location, slug, and a recruiter-facing bio."
      },
      {
        title: "Connect and sync GitHub",
        done: githubReady,
        hint: "Link GitHub OAuth and pull repository evidence into the portfolio."
      },
      {
        title: "Add portfolio evidence",
        done: evidenceReady,
        hint: "Feature projects, awards, completions, and manual achievements so the portfolio tells a story beyond GitHub stats."
      },
      {
        title: "Request issuer review",
        done: requestReady,
        hint: "Submit a credential request so reviewed evidence can become signed proof."
      },
      {
        title: "Issue credentials",
        done: credentialReady,
        hint: "Make sure at least one verifiable credential exists for public sharing."
      },
      {
        title: "Validate recruiter flow",
        done: verificationReady,
        hint: "Open a verification link and confirm a recruiter-visible verification event is recorded."
      }
    ];
  }, [portfolio, requests]);

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

  const saveDashboard = async () => {
    if (!userId) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await api(`/api/portfolio/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(profileForm)
      });
      await api(`/api/portfolio/users/${userId}/projects`, {
        method: "PUT",
        body: JSON.stringify({
          projects: projects
            .filter((project) => project.name.trim())
            .map((project, index) => ({
              name: project.name.trim(),
              description: project.description.trim(),
              repoUrl: project.repoUrl.trim(),
              liveUrl: project.liveUrl.trim(),
              featured: project.featured,
              sortOrder: index + 1,
              highlights: project.highlightsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
            }))
        })
      });
      await api(`/api/portfolio/users/${userId}/achievements`, {
        method: "PUT",
        body: JSON.stringify({
          achievements: achievements
            .filter((achievement) => achievement.title.trim())
            .map((achievement, index) => ({
              title: achievement.title.trim(),
              category: achievement.category.trim(),
              issuerName: achievement.issuerName.trim(),
              issuedOn: achievement.issuedOn.trim(),
              credentialUrl: achievement.credentialUrl.trim(),
              description: achievement.description.trim(),
              featured: achievement.featured,
              sortOrder: index + 1,
              evidence: achievement.evidenceText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
            }))
        })
      });
      await refresh();
      setSaveMessage("Portfolio dashboard saved.");
    } catch (e: any) {
      setSaveMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitRequest = async () => {
    if (!userId) return;
    setRequestMessage(null);
    try {
      await api(`/api/portfolio/users/${userId}/requests`, {
        method: "POST",
        body: JSON.stringify({
          requestType: requestDraft.requestType,
          targetName: requestDraft.targetName,
          targetUrl: requestDraft.targetUrl,
          evidenceOrigin: requestDraft.evidenceOrigin,
          payload: {
            repositoryName: requestDraft.targetName,
            role: requestDraft.role,
            commitCount: requestDraft.commitCount ? Number(requestDraft.commitCount) : undefined,
            mergedPrCount: requestDraft.mergedPrCount ? Number(requestDraft.mergedPrCount) : undefined,
            periodStart: requestDraft.periodStart || undefined,
            periodEnd: requestDraft.periodEnd || undefined,
            evidenceSummary: requestDraft.evidenceSummary || undefined
          }
        })
      });
      setRequestDraft(emptyRequestDraft());
      await refresh();
      setRequestMessage("Credential request submitted for issuer review.");
    } catch (e: any) {
      setRequestMessage(e.message);
    }
  };

  const reviewRequest = async (requestId: string, action: "approve" | "reject") => {
    setReviewMessage(null);
    try {
      await api(`/api/admin/portfolio/requests/${requestId}/${action}`, {
        method: "POST",
        body: JSON.stringify({ reviewerNote: action === "approve" ? "Evidence checked by issuer admin." : "Need stronger supporting evidence before issuance." })
      });
      await refresh();
      setReviewMessage(`Request ${action}d.`);
    } catch (e: any) {
      setReviewMessage(e.message);
    }
  };

  const updateProject = (index: number, patch: Partial<ProjectDraft>) => setProjects((current) => current.map((project, projectIndex) => projectIndex === index ? { ...project, ...patch } : project));
  const addProject = () => setProjects((current) => [...current, toProjectDraft(null)]);
  const removeProject = (index: number) => setProjects((current) => current.filter((_, projectIndex) => projectIndex !== index));

  const updateAchievement = (index: number, patch: Partial<AchievementDraft>) => setAchievements((current) => current.map((achievement, achievementIndex) => achievementIndex === index ? { ...achievement, ...patch } : achievement));
  const addAchievement = () => setAchievements((current) => [...current, toAchievementDraft(null)]);
  const removeAchievement = (index: number) => setAchievements((current) => current.filter((_, achievementIndex) => achievementIndex !== index));

  const updateCredentialStatus = async (credentialJti: string, status: "active" | "suspended" | "revoked") => {
    setReviewMessage(null);
    try {
      await api(`/api/admin/portfolio/credentials/${credentialJti}/status`, {
        method: "POST",
        body: JSON.stringify({ status })
      });
      await refresh();
      setReviewMessage(`Credential moved to ${status}.`);
    } catch (e: any) {
      setReviewMessage(e.message);
    }
  };

  const requestFormMode = requestDraft.requestType === "PortfolioAchievementCredential" ? "achievement" : "github";

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)" }}>
        <p style={{ margin: 0, color: "#93c5fd", fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" }}>Portfolio-first MVP</p>
        <h2 style={{ marginBottom: 12 }}>Verifiable developer portfolio dashboard</h2>
        <p style={{ maxWidth: 900, color: "#cbd5e1", marginBottom: 10 }}>
          Turn scattered developer evidence into a portfolio a recruiter can actually verify.
        </p>
        <p style={{ maxWidth: 900, color: "#94a3b8" }}>
          Instead of only pasting a GitHub link, this dashboard helps you package GitHub activity, featured projects, awards, completions, and manual proof into issuer-reviewed credentials with a public verification page.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 20 }}>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Why this is different</div>
            <div style={{ marginTop: 8, color: "#e2e8f0" }}>Recruiters do not just read your claims — they can verify issuer signature, registry status, and expiry.</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Core flow</div>
            <div style={{ marginTop: 8, color: "#e2e8f0" }}>Collect evidence → request review → issue credential → share public proof.</div>
          </div>
          <div style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Current focus</div>
            <div style={{ marginTop: 8, color: "#e2e8f0" }}>MVP-quality portfolio story with GitHub sync, manual achievements, issuance workflow, and recruiter verification UX.</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 20 }}>
          {Object.entries(stats).map(([label, value]) => (
            <div key={label} style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>{prettyLabel(label)}</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <button onClick={refresh}>Refresh summary</button>
          {userId ? <button onClick={() => void startGitHubOAuth()}>Connect GitHub</button> : null}
          {userId ? <button onClick={() => void syncGitHub()}>Sync GitHub evidence</button> : null}
          {userId ? <button onClick={() => void issuePortfolioCredentials()}>Issue portfolio credentials</button> : null}
          <Link to="/portfolio/sjw-dev">Open public portfolio</Link>
          {firstCredential ? <Link to={`/verify/${firstCredential.credential_jti}`}>Open recruiter verification</Link> : null}
        </div>
      </section>

      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Suggested onboarding path</h3>
            <p style={{ color: "#94a3b8" }}>A quick checklist for getting from an empty profile to recruiter-verifiable proof.</p>
          </div>
          <div style={{ color: "#94a3b8" }}>{onboardingSteps.filter((step) => step.done).length} / {onboardingSteps.length} done</div>
        </div>
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {onboardingSteps.map((step, index) => (
            <div key={step.title} style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: `1px solid ${step.done ? "#166534" : "#24324f"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <strong>{index + 1}. {step.title}</strong>
                <span style={{ color: step.done ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>{step.done ? "Done" : "Next"}</span>
              </div>
              <p style={{ marginBottom: 0, color: "#94a3b8" }}>{step.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Edit public profile</h3>
            <p style={{ color: "#94a3b8" }}>Bio, headline, slug, and evidence shown to recruiters.</p>
          </div>
          <button disabled={saving || !userId} onClick={() => void saveDashboard()}>{saving ? "Saving…" : "Save dashboard"}</button>
        </div>
        {saveMessage ? <p style={{ color: saveMessage.includes("saved") ? "#86efac" : "#fca5a5" }}>{saveMessage}</p> : null}
        {error ? <p style={{ color: "#fca5a5" }}>{error}</p> : null}
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <input value={profileForm.displayName} onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Display name" />
          <input value={profileForm.headline} onChange={(event) => setProfileForm((current) => ({ ...current, headline: event.target.value }))} placeholder="Headline" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <input value={profileForm.location} onChange={(event) => setProfileForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
            <input value={profileForm.portfolioSlug} onChange={(event) => setProfileForm((current) => ({ ...current, portfolioSlug: event.target.value }))} placeholder="Portfolio slug" />
          </div>
          <textarea rows={5} value={profileForm.bio} onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Short recruiter-facing bio" />
        </div>
      </section>

      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Featured projects and highlights</h3>
            <p style={{ color: "#94a3b8" }}>Curate the story first; raw repositories are supporting evidence.</p>
          </div>
          <button onClick={addProject}>Add project</button>
        </div>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {projects.map((project, index) => (
            <div key={`${project.name}-${index}`} style={{ padding: 16, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <strong>Project {index + 1}</strong>
                <button onClick={() => removeProject(index)}>Remove</button>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <input value={project.name} onChange={(event) => updateProject(index, { name: event.target.value })} placeholder="Project name" />
                <textarea rows={3} value={project.description} onChange={(event) => updateProject(index, { description: event.target.value })} placeholder="What this project proves" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <input value={project.repoUrl} onChange={(event) => updateProject(index, { repoUrl: event.target.value })} placeholder="Repository URL" />
                  <input value={project.liveUrl} onChange={(event) => updateProject(index, { liveUrl: event.target.value })} placeholder="Live/demo URL" />
                </div>
                <textarea rows={4} value={project.highlightsText} onChange={(event) => updateProject(index, { highlightsText: event.target.value })} placeholder="One highlight per line" />
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={project.featured} onChange={(event) => updateProject(index, { featured: event.target.checked })} />
                  Mark as featured
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Awards, completions, and manual achievements</h3>
            <p style={{ color: "#94a3b8" }}>Non-GitHub proof that still belongs in a verifiable career portfolio.</p>
          </div>
          <button onClick={addAchievement}>Add achievement</button>
        </div>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {achievements.map((achievement, index) => (
            <div key={`${achievement.title}-${index}`} style={{ padding: 16, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <strong>Achievement {index + 1}</strong>
                <button onClick={() => removeAchievement(index)}>Remove</button>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <input value={achievement.title} onChange={(event) => updateAchievement(index, { title: event.target.value })} placeholder="Title" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <input value={achievement.category} onChange={(event) => updateAchievement(index, { category: event.target.value })} placeholder="Category (award, completion, certification)" />
                  <input value={achievement.issuerName} onChange={(event) => updateAchievement(index, { issuerName: event.target.value })} placeholder="Issuer / organizer" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <input value={achievement.issuedOn} onChange={(event) => updateAchievement(index, { issuedOn: event.target.value })} placeholder="Issued on (YYYY-MM-DD)" />
                  <input value={achievement.credentialUrl} onChange={(event) => updateAchievement(index, { credentialUrl: event.target.value })} placeholder="Credential / proof URL" />
                </div>
                <textarea rows={3} value={achievement.description} onChange={(event) => updateAchievement(index, { description: event.target.value })} placeholder="What this achievement proves" />
                <textarea rows={4} value={achievement.evidenceText} onChange={(event) => updateAchievement(index, { evidenceText: event.target.value })} placeholder="Supporting evidence points, one per line" />
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={achievement.featured} onChange={(event) => updateAchievement(index, { featured: event.target.checked })} />
                  Feature on public portfolio
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }}>
        <h3 style={{ marginTop: 0 }}>Request credential issuance</h3>
        <p style={{ color: "#94a3b8" }}>This is where the product stops being a static portfolio page and becomes a verifiable proof workflow: the developer submits evidence, then the issuer/admin reviews it before a credential is issued.</p>
        {requestMessage ? <p style={{ color: requestMessage.includes("submitted") ? "#86efac" : "#fca5a5" }}>{requestMessage}</p> : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <button onClick={() => setRequestDraft(githubRequestTemplate())}>Use GitHub contribution template</button>
          <button onClick={() => setRequestDraft(achievementRequestTemplate())}>Use achievement template</button>
          <button onClick={() => setRequestDraft(emptyRequestDraft())}>Clear form</button>
        </div>
        <div style={{ padding: 14, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f", marginBottom: 14, color: "#94a3b8" }}>
          {requestFormMode === "github"
            ? "GitHub mode: request review for repository contribution evidence such as commits, merged PRs, and project role."
            : "Achievement mode: request review for awards, completions, certifications, or other non-GitHub evidence."}
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <select value={requestDraft.requestType} onChange={(event) => setRequestDraft((current) => ({ ...current, requestType: event.target.value, evidenceOrigin: event.target.value === "PortfolioAchievementCredential" ? "manual" : "github" }))}>
              <option value="GitHubContributionCredential">GitHubContributionCredential</option>
              <option value="PortfolioAchievementCredential">PortfolioAchievementCredential</option>
            </select>
            <input value={requestDraft.evidenceOrigin} onChange={(event) => setRequestDraft((current) => ({ ...current, evidenceOrigin: event.target.value }))} placeholder="Evidence origin" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <input value={requestDraft.targetName} onChange={(event) => setRequestDraft((current) => ({ ...current, targetName: event.target.value }))} placeholder={requestFormMode === "github" ? "Repository or target name" : "Achievement / award / completion title"} />
            <input value={requestDraft.targetUrl} onChange={(event) => setRequestDraft((current) => ({ ...current, targetUrl: event.target.value }))} placeholder={requestFormMode === "github" ? "Repository / evidence URL" : "Proof / certificate URL"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <input value={requestDraft.role} onChange={(event) => setRequestDraft((current) => ({ ...current, role: event.target.value }))} placeholder={requestFormMode === "github" ? "Role" : "Relationship to evidence"} />
            <input disabled={requestFormMode !== "github"} value={requestDraft.commitCount} onChange={(event) => setRequestDraft((current) => ({ ...current, commitCount: event.target.value }))} placeholder="Commit count" />
            <input disabled={requestFormMode !== "github"} value={requestDraft.mergedPrCount} onChange={(event) => setRequestDraft((current) => ({ ...current, mergedPrCount: event.target.value }))} placeholder="Merged PR count" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <input disabled={requestFormMode !== "github"} value={requestDraft.periodStart} onChange={(event) => setRequestDraft((current) => ({ ...current, periodStart: event.target.value }))} placeholder="Period start" />
            <input disabled={requestFormMode !== "github"} value={requestDraft.periodEnd} onChange={(event) => setRequestDraft((current) => ({ ...current, periodEnd: event.target.value }))} placeholder="Period end" />
          </div>
          <textarea rows={4} value={requestDraft.evidenceSummary} onChange={(event) => setRequestDraft((current) => ({ ...current, evidenceSummary: event.target.value }))} placeholder={requestFormMode === "github" ? "Explain what the issuer should verify about the repository contribution" : "Explain what the issuer should verify about the award, completion, or external evidence"} />
          <div><button disabled={!userId} onClick={() => void submitRequest()}>Submit request for review</button></div>
        </div>
      </section>

      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }}>
        <h3 style={{ marginTop: 0 }}>Issuer review queue</h3>
        <p style={{ color: "#94a3b8" }}>Simplified admin panel wired directly into the dashboard for MVP practicality.</p>
        {reviewMessage ? <p style={{ color: reviewMessage.includes("Request") ? "#86efac" : "#fca5a5" }}>{reviewMessage}</p> : null}
        <div style={{ display: "grid", gap: 14 }}>
          {requests.map((request: any) => (
            <div key={request.id} style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{request.request_type}</strong>
                <span style={{ color: request.status === "approved" ? "#4ade80" : request.status === "rejected" ? "#fca5a5" : "#fbbf24" }}>{request.status}</span>
              </div>
              <p style={{ marginBottom: 8 }}>{request.user?.display_name} requested review for <strong>{request.target_name || "unspecified evidence"}</strong>.</p>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>{JSON.stringify(request.payload, null, 2)}</pre>
              {request.reviewer_note ? <p style={{ color: "#cbd5e1" }}>Reviewer note: {request.reviewer_note}</p> : null}
              {request.status === "pending" ? (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button onClick={() => void reviewRequest(request.id, "approve")}>Approve + issue</button>
                  <button onClick={() => void reviewRequest(request.id, "reject")}>Reject</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }}>
        <h3 style={{ marginTop: 0 }}>Issued credentials and registry controls</h3>
        <p style={{ color: "#94a3b8" }}>Admin-side status controls for the recruiter verification page: active, suspended, or revoked.</p>
        <div style={{ display: "grid", gap: 14 }}>
          {(portfolio?.credentials ?? []).map((credential: any) => (
            <div key={credential.credential_jti} style={{ padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <strong>{credential.credential_type}</strong>
                <span style={{ color: credential.status === "active" ? "#4ade80" : credential.status === "revoked" ? "#fca5a5" : "#fbbf24" }}>{credential.status}</span>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}>{JSON.stringify(credential.summary, null, 2)}</pre>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to={`/verify/${credential.credential_jti}`}>Open verification page</Link>
                <button onClick={() => void updateCredentialStatus(credential.credential_jti, "active")}>Mark active</button>
                <button onClick={() => void updateCredentialStatus(credential.credential_jti, "suspended")}>Suspend</button>
                <button onClick={() => void updateCredentialStatus(credential.credential_jti, "revoked")}>Revoke</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }}>
        <h3 style={{ marginTop: 0 }}>Live API summary</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      </section>
    </div>
  );
}
