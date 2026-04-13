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
    return (_jsxs("div", { style: { display: "grid", gap: 24 }, children: [_jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)" }, children: [_jsx("p", { style: { margin: 0, color: "#93c5fd", fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" }, children: "Portfolio-first MVP" }), _jsx("h2", { style: { marginBottom: 12 }, children: "Verifiable developer portfolio dashboard" }), _jsx("p", { style: { maxWidth: 900, color: "#cbd5e1" }, children: "Edit your public story, attach GitHub and non-GitHub evidence, submit credential requests, and review issuer decisions in one place." }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 20 }, children: Object.entries(stats).map(([label, value]) => (_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }, children: label }), _jsx("div", { style: { fontSize: 28, fontWeight: 700 }, children: value })] }, label))) }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }, children: [_jsx("button", { onClick: refresh, children: "Refresh summary" }), userId ? _jsx("button", { onClick: () => void startGitHubOAuth(), children: "Connect GitHub" }) : null, userId ? _jsx("button", { onClick: () => void syncGitHub(), children: "Sync GitHub evidence" }) : null, userId ? _jsx("button", { onClick: () => void issuePortfolioCredentials(), children: "Issue portfolio credentials" }) : null, _jsx(Link, { to: "/portfolio/sjw-dev", children: "Open public portfolio" }), firstCredential ? _jsx(Link, { to: `/verify/${firstCredential.credential_jti}`, children: "Open recruiter verification" }) : null] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Edit public profile" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Bio, headline, slug, and evidence shown to recruiters." })] }), _jsx("button", { disabled: saving || !userId, onClick: () => void saveDashboard(), children: saving ? "Saving…" : "Save dashboard" })] }), saveMessage ? _jsx("p", { style: { color: saveMessage.includes("saved") ? "#86efac" : "#fca5a5" }, children: saveMessage }) : null, error ? _jsx("p", { style: { color: "#fca5a5" }, children: error }) : null, _jsxs("div", { style: { display: "grid", gap: 12, marginTop: 16 }, children: [_jsx("input", { value: profileForm.displayName, onChange: (event) => setProfileForm((current) => ({ ...current, displayName: event.target.value })), placeholder: "Display name" }), _jsx("input", { value: profileForm.headline, onChange: (event) => setProfileForm((current) => ({ ...current, headline: event.target.value })), placeholder: "Headline" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: profileForm.location, onChange: (event) => setProfileForm((current) => ({ ...current, location: event.target.value })), placeholder: "Location" }), _jsx("input", { value: profileForm.portfolioSlug, onChange: (event) => setProfileForm((current) => ({ ...current, portfolioSlug: event.target.value })), placeholder: "Portfolio slug" })] }), _jsx("textarea", { rows: 5, value: profileForm.bio, onChange: (event) => setProfileForm((current) => ({ ...current, bio: event.target.value })), placeholder: "Short recruiter-facing bio" })] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Featured projects and highlights" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Curate the story first; raw repositories are supporting evidence." })] }), _jsx("button", { onClick: addProject, children: "Add project" })] }), _jsx("div", { style: { display: "grid", gap: 16, marginTop: 16 }, children: projects.map((project, index) => (_jsxs("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }, children: [_jsxs("strong", { children: ["Project ", index + 1] }), _jsx("button", { onClick: () => removeProject(index), children: "Remove" })] }), _jsxs("div", { style: { display: "grid", gap: 10, marginTop: 12 }, children: [_jsx("input", { value: project.name, onChange: (event) => updateProject(index, { name: event.target.value }), placeholder: "Project name" }), _jsx("textarea", { rows: 3, value: project.description, onChange: (event) => updateProject(index, { description: event.target.value }), placeholder: "What this project proves" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: project.repoUrl, onChange: (event) => updateProject(index, { repoUrl: event.target.value }), placeholder: "Repository URL" }), _jsx("input", { value: project.liveUrl, onChange: (event) => updateProject(index, { liveUrl: event.target.value }), placeholder: "Live/demo URL" })] }), _jsx("textarea", { rows: 4, value: project.highlightsText, onChange: (event) => updateProject(index, { highlightsText: event.target.value }), placeholder: "One highlight per line" }), _jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [_jsx("input", { type: "checkbox", checked: project.featured, onChange: (event) => updateProject(index, { featured: event.target.checked }) }), "Mark as featured"] })] })] }, `${project.name}-${index}`))) })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Awards, completions, and manual achievements" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Non-GitHub proof that still belongs in a verifiable career portfolio." })] }), _jsx("button", { onClick: addAchievement, children: "Add achievement" })] }), _jsx("div", { style: { display: "grid", gap: 16, marginTop: 16 }, children: achievements.map((achievement, index) => (_jsxs("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }, children: [_jsxs("strong", { children: ["Achievement ", index + 1] }), _jsx("button", { onClick: () => removeAchievement(index), children: "Remove" })] }), _jsxs("div", { style: { display: "grid", gap: 10, marginTop: 12 }, children: [_jsx("input", { value: achievement.title, onChange: (event) => updateAchievement(index, { title: event.target.value }), placeholder: "Title" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: achievement.category, onChange: (event) => updateAchievement(index, { category: event.target.value }), placeholder: "Category (award, completion, certification)" }), _jsx("input", { value: achievement.issuerName, onChange: (event) => updateAchievement(index, { issuerName: event.target.value }), placeholder: "Issuer / organizer" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: achievement.issuedOn, onChange: (event) => updateAchievement(index, { issuedOn: event.target.value }), placeholder: "Issued on (YYYY-MM-DD)" }), _jsx("input", { value: achievement.credentialUrl, onChange: (event) => updateAchievement(index, { credentialUrl: event.target.value }), placeholder: "Credential / proof URL" })] }), _jsx("textarea", { rows: 3, value: achievement.description, onChange: (event) => updateAchievement(index, { description: event.target.value }), placeholder: "What this achievement proves" }), _jsx("textarea", { rows: 4, value: achievement.evidenceText, onChange: (event) => updateAchievement(index, { evidenceText: event.target.value }), placeholder: "Supporting evidence points, one per line" }), _jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [_jsx("input", { type: "checkbox", checked: achievement.featured, onChange: (event) => updateAchievement(index, { featured: event.target.checked }) }), "Feature on public portfolio"] })] })] }, `${achievement.title}-${index}`))) })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Request credential issuance" }), _jsx("p", { style: { color: "#94a3b8" }, children: "This is the missing workflow from the original prompt: the user requests evidence review, then the issuer/admin approves or rejects it." }), requestMessage ? _jsx("p", { style: { color: requestMessage.includes("submitted") ? "#86efac" : "#fca5a5" }, children: requestMessage }) : null, _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: requestDraft.requestType, onChange: (event) => setRequestDraft((current) => ({ ...current, requestType: event.target.value })), placeholder: "Credential type" }), _jsx("input", { value: requestDraft.evidenceOrigin, onChange: (event) => setRequestDraft((current) => ({ ...current, evidenceOrigin: event.target.value })), placeholder: "Evidence origin" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: requestDraft.targetName, onChange: (event) => setRequestDraft((current) => ({ ...current, targetName: event.target.value })), placeholder: "Repository or target name" }), _jsx("input", { value: requestDraft.targetUrl, onChange: (event) => setRequestDraft((current) => ({ ...current, targetUrl: event.target.value })), placeholder: "Repository / evidence URL" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }, children: [_jsx("input", { value: requestDraft.role, onChange: (event) => setRequestDraft((current) => ({ ...current, role: event.target.value })), placeholder: "Role" }), _jsx("input", { value: requestDraft.commitCount, onChange: (event) => setRequestDraft((current) => ({ ...current, commitCount: event.target.value })), placeholder: "Commit count" }), _jsx("input", { value: requestDraft.mergedPrCount, onChange: (event) => setRequestDraft((current) => ({ ...current, mergedPrCount: event.target.value })), placeholder: "Merged PR count" })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: requestDraft.periodStart, onChange: (event) => setRequestDraft((current) => ({ ...current, periodStart: event.target.value })), placeholder: "Period start" }), _jsx("input", { value: requestDraft.periodEnd, onChange: (event) => setRequestDraft((current) => ({ ...current, periodEnd: event.target.value })), placeholder: "Period end" })] }), _jsx("textarea", { rows: 4, value: requestDraft.evidenceSummary, onChange: (event) => setRequestDraft((current) => ({ ...current, evidenceSummary: event.target.value })), placeholder: "Explain what the issuer should verify" }), _jsx("div", { children: _jsx("button", { disabled: !userId, onClick: () => void submitRequest(), children: "Submit request for review" }) })] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Issuer review queue" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Simplified admin panel wired directly into the dashboard for MVP practicality." }), reviewMessage ? _jsx("p", { style: { color: reviewMessage.includes("Request") ? "#86efac" : "#fca5a5" }, children: reviewMessage }) : null, _jsx("div", { style: { display: "grid", gap: 14 }, children: requests.map((request) => (_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }, children: [_jsx("strong", { children: request.request_type }), _jsx("span", { style: { color: request.status === "approved" ? "#4ade80" : request.status === "rejected" ? "#fca5a5" : "#fbbf24" }, children: request.status })] }), _jsxs("p", { style: { marginBottom: 8 }, children: [request.user?.display_name, " requested review for ", _jsx("strong", { children: request.target_name || "unspecified evidence" }), "."] }), _jsx("pre", { style: { whiteSpace: "pre-wrap", marginTop: 0 }, children: JSON.stringify(request.payload, null, 2) }), request.reviewer_note ? _jsxs("p", { style: { color: "#cbd5e1" }, children: ["Reviewer note: ", request.reviewer_note] }) : null, request.status === "pending" ? (_jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx("button", { onClick: () => void reviewRequest(request.id, "approve"), children: "Approve + issue" }), _jsx("button", { onClick: () => void reviewRequest(request.id, "reject"), children: "Reject" })] })) : null] }, request.id))) })] }), _jsxs("section", { style: { padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Live API summary" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data, null, 2) })] })] }));
}
