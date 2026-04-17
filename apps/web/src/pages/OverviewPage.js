import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";
function toProjectDraft(project) {
    return {
        name: project?.name ?? "",
        description: project?.description ?? "",
        repoUrl: project?.repo_url ?? "",
        liveUrl: project?.live_url ?? "",
        highlightsText: Array.isArray(project?.highlights) ? project.highlights.join("\n") : "",
        featured: Boolean(project?.featured)
    };
}
function toAchievementDraft(achievement) {
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
const emptyRequestDraft = () => ({
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
const githubRequestTemplate = () => ({
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
const achievementRequestTemplate = () => ({
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
function prettyLabel(label) {
    return label
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (value) => value.toUpperCase());
}
function statusTone(status) {
    if (status === "active")
        return { color: "#4ade80", label: "Active" };
    if (status === "revoked")
        return { color: "#fca5a5", label: "Revoked" };
    if (status === "suspended")
        return { color: "#fbbf24", label: "Suspended" };
    return { color: "#cbd5e1", label: status };
}
export function OverviewPage() {
    const { data, error, refresh } = useSummary();
    const portfolio = data?.portfolio;
    const requests = data?.requests ?? [];
    const firstCredential = portfolio?.credentials?.[0];
    const userId = portfolio?.profile?.id;
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [requestMessage, setRequestMessage] = useState(null);
    const [reviewMessage, setReviewMessage] = useState(null);
    const [profileForm, setProfileForm] = useState({ displayName: "", headline: "", location: "", portfolioSlug: "", bio: "" });
    const [projects, setProjects] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [requestDraft, setRequestDraft] = useState(emptyRequestDraft());
    useEffect(() => {
        if (!portfolio?.profile)
            return;
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
        pendingRequests: requests.filter((item) => item.status === "pending").length,
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
        if (!userId)
            return;
        const result = await api("/api/github/oauth/start", {
            method: "POST",
            body: JSON.stringify({ userId })
        });
        window.location.href = result.authorizeUrl;
    };
    const syncGitHub = async () => {
        if (!userId)
            return;
        await api(`/api/github/sync/${userId}`, { method: "POST" });
        await refresh();
    };
    const issuePortfolioCredentials = async () => {
        if (!userId)
            return;
        await api(`/api/portfolio/${userId}/credentials/issue`, { method: "POST", body: JSON.stringify({}) });
        await refresh();
    };
    const saveDashboard = async () => {
        if (!userId)
            return;
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
        }
        catch (e) {
            setSaveMessage(e.message);
        }
        finally {
            setSaving(false);
        }
    };
    const submitRequest = async () => {
        if (!userId)
            return;
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
        }
        catch (e) {
            setRequestMessage(e.message);
        }
    };
    const reviewRequest = async (requestId, action) => {
        setReviewMessage(null);
        try {
            await api(`/api/admin/portfolio/requests/${requestId}/${action}`, {
                method: "POST",
                body: JSON.stringify({ reviewerNote: action === "approve" ? "Evidence checked by issuer admin." : "Need stronger supporting evidence before issuance." })
            });
            await refresh();
            setReviewMessage(`Request ${action}d.`);
        }
        catch (e) {
            setReviewMessage(e.message);
        }
    };
    const updateProject = (index, patch) => setProjects((current) => current.map((project, projectIndex) => projectIndex === index ? { ...project, ...patch } : project));
    const addProject = () => setProjects((current) => [...current, toProjectDraft(null)]);
    const removeProject = (index) => setProjects((current) => current.filter((_, projectIndex) => projectIndex !== index));
    const updateAchievement = (index, patch) => setAchievements((current) => current.map((achievement, achievementIndex) => achievementIndex === index ? { ...achievement, ...patch } : achievement));
    const addAchievement = () => setAchievements((current) => [...current, toAchievementDraft(null)]);
    const removeAchievement = (index) => setAchievements((current) => current.filter((_, achievementIndex) => achievementIndex !== index));
    const updateCredentialStatus = async (credentialJti, status) => {
        setReviewMessage(null);
        try {
            await api(`/api/admin/portfolio/credentials/${credentialJti}/status`, {
                method: "POST",
                body: JSON.stringify({ status })
            });
            await refresh();
            setReviewMessage(`Credential moved to ${status}.`);
        }
        catch (e) {
            setReviewMessage(e.message);
        }
    };
    const requestFormMode = requestDraft.requestType === "PortfolioAchievementCredential" ? "achievement" : "github";
    return (_jsxs("div", { style: { display: "grid", gap: 24 }, children: [_jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)" }, children: [_jsx("p", { style: { margin: 0, color: "#93c5fd", fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" }, children: "Portfolio-first MVP" }), _jsx("h2", { style: { marginBottom: 12 }, children: "Verifiable developer portfolio dashboard" }), _jsx("p", { style: { maxWidth: 900, color: "#cbd5e1", marginBottom: 10 }, children: "Turn scattered developer evidence into a portfolio a recruiter can actually verify." }), _jsx("p", { style: { maxWidth: 900, color: "#94a3b8", marginBottom: 16 }, children: "Instead of only pasting a GitHub link, this dashboard helps you package GitHub activity, featured projects, awards, completions, and manual proof into issuer-reviewed credentials with a public verification page." }), _jsxs("div", { style: { padding: 14, borderRadius: 16, background: "rgba(11, 16, 32, 0.9)", border: "1px solid #24324f", color: "#cbd5e1", maxWidth: 920 }, children: [_jsx("strong", { style: { color: "#93c5fd" }, children: "Fast demo script:" }), " connect or explain GitHub evidence, show curated projects and achievements, submit a request, approve it, then open the recruiter verification page."] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 20 }, children: [_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }, children: "Why this is different" }), _jsx("div", { style: { marginTop: 8, color: "#e2e8f0" }, children: "Recruiters do not just read your claims \u2014 they can verify issuer signature, registry status, and expiry." })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }, children: "Core flow" }), _jsx("div", { style: { marginTop: 8, color: "#e2e8f0" }, children: "Collect evidence \u2192 request review \u2192 issue credential \u2192 share public proof." })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }, children: "Current focus" }), _jsx("div", { style: { marginTop: 8, color: "#e2e8f0" }, children: "MVP-quality portfolio story with GitHub sync, manual achievements, issuance workflow, and recruiter verification UX." })] })] }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 20 }, children: Object.entries(stats).map(([label, value]) => (_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }, children: prettyLabel(label) }), _jsx("div", { style: { fontSize: 28, fontWeight: 700 }, children: value })] }, label))) }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }, children: [_jsx("button", { onClick: refresh, children: "Refresh summary" }), userId ? _jsx("button", { onClick: () => void startGitHubOAuth(), children: "Connect GitHub" }) : null, userId ? _jsx("button", { onClick: () => void syncGitHub(), children: "Sync GitHub evidence" }) : null, userId ? _jsx("button", { onClick: () => void issuePortfolioCredentials(), children: "Issue portfolio credentials" }) : null, _jsx(Link, { to: "/portfolio/sjw-dev", children: "Open public portfolio" }), firstCredential ? _jsx(Link, { to: `/verify/${firstCredential.credential_jti}`, children: "Open recruiter verification" }) : null] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Suggested onboarding path" }), _jsx("p", { style: { color: "#94a3b8" }, children: "A quick checklist for getting from an empty profile to recruiter-verifiable proof." })] }), _jsxs("div", { style: { color: "#94a3b8" }, children: [onboardingSteps.filter((step) => step.done).length, " / ", onboardingSteps.length, " done"] })] }), _jsx("p", { style: { color: "#94a3b8", marginTop: 12 }, children: "If you only have two minutes, clear the first four steps and then jump straight to a verification link." }), _jsx("div", { style: { display: "grid", gap: 12, marginTop: 16 }, children: onboardingSteps.map((step, index) => (_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: `1px solid ${step.done ? "#166534" : "#24324f"}` }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [_jsxs("strong", { children: [index + 1, ". ", step.title] }), _jsx("span", { style: { color: step.done ? "#4ade80" : "#fbbf24", fontWeight: 700 }, children: step.done ? "Done" : "Next" })] }), _jsx("p", { style: { marginBottom: 0, color: "#94a3b8" }, children: step.hint })] }, step.title))) })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Edit public profile" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Bio, headline, slug, and evidence shown to recruiters." })] }), _jsx("button", { disabled: saving || !userId, onClick: () => void saveDashboard(), children: saving ? "Saving…" : "Save dashboard" })] }), saveMessage ? _jsx("p", { style: { color: saveMessage.includes("saved") ? "#86efac" : "#fca5a5" }, children: saveMessage }) : null, error ? _jsx("p", { style: { color: "#fca5a5" }, children: error }) : null, _jsxs("div", { style: { display: "grid", gap: 12, marginTop: 16 }, children: [_jsx("input", { value: profileForm.displayName, onChange: (event) => setProfileForm((current) => ({ ...current, displayName: event.target.value })), placeholder: "Display name" }), _jsx("input", { value: profileForm.headline, onChange: (event) => setProfileForm((current) => ({ ...current, headline: event.target.value })), placeholder: "Headline" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: profileForm.location, onChange: (event) => setProfileForm((current) => ({ ...current, location: event.target.value })), placeholder: "Location" }), _jsx("input", { value: profileForm.portfolioSlug, onChange: (event) => setProfileForm((current) => ({ ...current, portfolioSlug: event.target.value })), placeholder: "Portfolio slug" })] }), _jsx("textarea", { rows: 5, value: profileForm.bio, onChange: (event) => setProfileForm((current) => ({ ...current, bio: event.target.value })), placeholder: "Short recruiter-facing bio" })] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Featured projects and highlights" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Curate the story first; raw repositories are supporting evidence." })] }), _jsx("button", { onClick: addProject, children: "Add project" })] }), _jsxs("div", { style: { display: "grid", gap: 16, marginTop: 16 }, children: [!projects.length ? _jsx("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }, children: "No featured projects yet. Add one or two strong projects that explain what you built and why they matter." }) : null, projects.map((project, index) => (_jsxs("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }, children: [_jsxs("strong", { children: ["Project ", index + 1] }), _jsx("button", { onClick: () => removeProject(index), children: "Remove" })] }), _jsxs("div", { style: { display: "grid", gap: 10, marginTop: 12 }, children: [_jsx("input", { value: project.name, onChange: (event) => updateProject(index, { name: event.target.value }), placeholder: "Project name" }), _jsx("textarea", { rows: 3, value: project.description, onChange: (event) => updateProject(index, { description: event.target.value }), placeholder: "What this project proves" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: project.repoUrl, onChange: (event) => updateProject(index, { repoUrl: event.target.value }), placeholder: "Repository URL" }), _jsx("input", { value: project.liveUrl, onChange: (event) => updateProject(index, { liveUrl: event.target.value }), placeholder: "Live/demo URL" })] }), _jsx("textarea", { rows: 4, value: project.highlightsText, onChange: (event) => updateProject(index, { highlightsText: event.target.value }), placeholder: "One highlight per line" }), _jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [_jsx("input", { type: "checkbox", checked: project.featured, onChange: (event) => updateProject(index, { featured: event.target.checked }) }), "Mark as featured"] })] })] }, `${project.name}-${index}`)))] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Awards, completions, and manual achievements" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Non-GitHub proof that still belongs in a verifiable career portfolio." })] }), _jsx("button", { onClick: addAchievement, children: "Add achievement" })] }), _jsxs("div", { style: { display: "grid", gap: 16, marginTop: 16 }, children: [!achievements.length ? _jsx("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }, children: "No non-GitHub evidence yet. Add awards, completions, certifications, or proof links that strengthen the portfolio story." }) : null, achievements.map((achievement, index) => (_jsxs("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }, children: [_jsxs("strong", { children: ["Achievement ", index + 1] }), _jsx("button", { onClick: () => removeAchievement(index), children: "Remove" })] }), _jsxs("div", { style: { display: "grid", gap: 10, marginTop: 12 }, children: [_jsx("input", { value: achievement.title, onChange: (event) => updateAchievement(index, { title: event.target.value }), placeholder: "Title" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: achievement.category, onChange: (event) => updateAchievement(index, { category: event.target.value }), placeholder: "Category (award, completion, certification)" }), _jsx("input", { value: achievement.issuerName, onChange: (event) => updateAchievement(index, { issuerName: event.target.value }), placeholder: "Issuer / organizer" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: achievement.issuedOn, onChange: (event) => updateAchievement(index, { issuedOn: event.target.value }), placeholder: "Issued on (YYYY-MM-DD)" }), _jsx("input", { value: achievement.credentialUrl, onChange: (event) => updateAchievement(index, { credentialUrl: event.target.value }), placeholder: "Credential / proof URL" })] }), _jsx("textarea", { rows: 3, value: achievement.description, onChange: (event) => updateAchievement(index, { description: event.target.value }), placeholder: "What this achievement proves" }), _jsx("textarea", { rows: 4, value: achievement.evidenceText, onChange: (event) => updateAchievement(index, { evidenceText: event.target.value }), placeholder: "Supporting evidence points, one per line" }), _jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [_jsx("input", { type: "checkbox", checked: achievement.featured, onChange: (event) => updateAchievement(index, { featured: event.target.checked }) }), "Feature on public portfolio"] })] })] }, `${achievement.title}-${index}`)))] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Request credential issuance" }), _jsx("p", { style: { color: "#94a3b8" }, children: "This is where the product stops being a static portfolio page and becomes a verifiable proof workflow: the developer submits evidence, then the issuer/admin reviews it before a credential is issued." }), requestMessage ? _jsx("p", { style: { color: requestMessage.includes("submitted") ? "#86efac" : "#fca5a5" }, children: requestMessage }) : null, _jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }, children: [_jsx("button", { onClick: () => setRequestDraft(githubRequestTemplate()), children: "Use GitHub contribution template" }), _jsx("button", { onClick: () => setRequestDraft(achievementRequestTemplate()), children: "Use achievement template" }), _jsx("button", { onClick: () => setRequestDraft(emptyRequestDraft()), children: "Clear form" })] }), _jsx("div", { style: { padding: 14, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f", marginBottom: 14, color: "#94a3b8" }, children: requestFormMode === "github"
                            ? "GitHub mode: request review for repository contribution evidence such as commits, merged PRs, and project role."
                            : "Achievement mode: request review for awards, completions, certifications, or other non-GitHub evidence." }), _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsxs("select", { value: requestDraft.requestType, onChange: (event) => setRequestDraft((current) => ({ ...current, requestType: event.target.value, evidenceOrigin: event.target.value === "PortfolioAchievementCredential" ? "manual" : "github" })), children: [_jsx("option", { value: "GitHubContributionCredential", children: "GitHubContributionCredential" }), _jsx("option", { value: "PortfolioAchievementCredential", children: "PortfolioAchievementCredential" })] }), _jsx("input", { value: requestDraft.evidenceOrigin, onChange: (event) => setRequestDraft((current) => ({ ...current, evidenceOrigin: event.target.value })), placeholder: "Evidence origin" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: requestDraft.targetName, onChange: (event) => setRequestDraft((current) => ({ ...current, targetName: event.target.value })), placeholder: requestFormMode === "github" ? "Repository or target name" : "Achievement / award / completion title" }), _jsx("input", { value: requestDraft.targetUrl, onChange: (event) => setRequestDraft((current) => ({ ...current, targetUrl: event.target.value })), placeholder: requestFormMode === "github" ? "Repository / evidence URL" : "Proof / certificate URL" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }, children: [_jsx("input", { value: requestDraft.role, onChange: (event) => setRequestDraft((current) => ({ ...current, role: event.target.value })), placeholder: requestFormMode === "github" ? "Role" : "Relationship to evidence" }), _jsx("input", { disabled: requestFormMode !== "github", value: requestDraft.commitCount, onChange: (event) => setRequestDraft((current) => ({ ...current, commitCount: event.target.value })), placeholder: "Commit count" }), _jsx("input", { disabled: requestFormMode !== "github", value: requestDraft.mergedPrCount, onChange: (event) => setRequestDraft((current) => ({ ...current, mergedPrCount: event.target.value })), placeholder: "Merged PR count" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { disabled: requestFormMode !== "github", value: requestDraft.periodStart, onChange: (event) => setRequestDraft((current) => ({ ...current, periodStart: event.target.value })), placeholder: "Period start" }), _jsx("input", { disabled: requestFormMode !== "github", value: requestDraft.periodEnd, onChange: (event) => setRequestDraft((current) => ({ ...current, periodEnd: event.target.value })), placeholder: "Period end" })] }), _jsx("textarea", { rows: 4, value: requestDraft.evidenceSummary, onChange: (event) => setRequestDraft((current) => ({ ...current, evidenceSummary: event.target.value })), placeholder: requestFormMode === "github" ? "Explain what the issuer should verify about the repository contribution" : "Explain what the issuer should verify about the award, completion, or external evidence" }), _jsx("div", { children: _jsx("button", { disabled: !userId, onClick: () => void submitRequest(), children: "Submit request for review" }) })] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Issuer review queue" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Simplified admin panel wired directly into the dashboard for MVP practicality." }), reviewMessage ? _jsx("p", { style: { color: reviewMessage.includes("Request") ? "#86efac" : "#fca5a5" }, children: reviewMessage }) : null, _jsxs("div", { style: { display: "grid", gap: 14 }, children: [!requests.length ? _jsx("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }, children: "No review requests yet. Submit one from the request form below to show the issuer workflow end to end." }) : null, requests.map((request) => (_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }, children: [_jsx("strong", { children: request.request_type }), _jsx("span", { style: { color: request.status === "approved" ? "#4ade80" : request.status === "rejected" ? "#fca5a5" : "#fbbf24" }, children: request.status })] }), _jsxs("p", { style: { marginBottom: 8 }, children: [request.user?.display_name, " requested review for ", _jsx("strong", { children: request.target_name || "unspecified evidence" }), "."] }), _jsx("pre", { style: { whiteSpace: "pre-wrap", marginTop: 0 }, children: JSON.stringify(request.payload, null, 2) }), request.reviewer_note ? _jsxs("p", { style: { color: "#cbd5e1" }, children: ["Reviewer note: ", request.reviewer_note] }) : null, request.status === "pending" ? (_jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx("button", { onClick: () => void reviewRequest(request.id, "approve"), children: "Approve + issue" }), _jsx("button", { onClick: () => void reviewRequest(request.id, "reject"), children: "Reject" })] })) : null] }, request.id)))] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Issued credentials and registry controls" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Admin-side status controls for the recruiter verification page: active, suspended, or revoked." }), _jsxs("div", { style: { display: "grid", gap: 14 }, children: [!(portfolio?.credentials ?? []).length ? _jsx("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px dashed #24324f", color: "#94a3b8" }, children: "No issued credentials yet. Approve a request or use the issue button above before opening the recruiter verification page." }) : null, (portfolio?.credentials ?? []).map((credential) => {
                                const tone = statusTone(credential.status);
                                return (_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: `1px solid ${tone.color}` }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [_jsx("strong", { children: credential.credential_type }), _jsx("span", { style: { color: tone.color, fontWeight: 700 }, children: tone.label })] }), credential.summary?.title ? _jsx("p", { style: { marginBottom: 8, color: "#93c5fd" }, children: credential.summary.title }) : null, credential.summary?.narrative ? _jsx("p", { style: { color: "#e2e8f0" }, children: credential.summary.narrative }) : null, _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }, children: [credential.summary?.repository ? _jsxs("div", { style: { color: "#94a3b8" }, children: [_jsx("strong", { style: { color: "#cbd5e1" }, children: "Repository:" }), " ", credential.summary.repository] }) : null, credential.summary?.role ? _jsxs("div", { style: { color: "#94a3b8" }, children: [_jsx("strong", { style: { color: "#cbd5e1" }, children: "Role:" }), " ", credential.summary.role] }) : null, credential.summary?.commitCount ? _jsxs("div", { style: { color: "#94a3b8" }, children: [_jsx("strong", { style: { color: "#cbd5e1" }, children: "Commits:" }), " ", credential.summary.commitCount] }) : null, credential.summary?.mergedPrCount ? _jsxs("div", { style: { color: "#94a3b8" }, children: [_jsx("strong", { style: { color: "#cbd5e1" }, children: "Merged PRs:" }), " ", credential.summary.mergedPrCount] }) : null, credential.summary?.category ? _jsxs("div", { style: { color: "#94a3b8" }, children: [_jsx("strong", { style: { color: "#cbd5e1" }, children: "Category:" }), " ", credential.summary.category] }) : null, credential.summary?.issuerName ? _jsxs("div", { style: { color: "#94a3b8" }, children: [_jsx("strong", { style: { color: "#cbd5e1" }, children: "Issuer:" }), " ", credential.summary.issuerName] }) : null] }), _jsxs("details", { children: [_jsx("summary", { style: { cursor: "pointer", color: "#94a3b8" }, children: "Show raw summary JSON" }), _jsx("pre", { style: { whiteSpace: "pre-wrap", marginBottom: 12 }, children: JSON.stringify(credential.summary, null, 2) })] }), _jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }, children: [_jsx(Link, { to: `/verify/${credential.credential_jti}`, children: "Open verification page" }), _jsx("button", { onClick: () => void updateCredentialStatus(credential.credential_jti, "active"), children: "Mark active" }), _jsx("button", { onClick: () => void updateCredentialStatus(credential.credential_jti, "suspended"), children: "Suspend" }), _jsx("button", { onClick: () => void updateCredentialStatus(credential.credential_jti, "revoked"), children: "Revoke" })] })] }, credential.credential_jti));
                            })] })] }), _jsxs("section", { style: { padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Live API summary" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data, null, 2) })] })] }));
}
