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
export function OverviewPage() {
    const { data, error, refresh } = useSummary();
    const portfolio = data?.portfolio;
    const firstCredential = portfolio?.credentials?.[0];
    const userId = portfolio?.profile?.id;
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [profileForm, setProfileForm] = useState({ displayName: "", headline: "", location: "", portfolioSlug: "", bio: "" });
    const [projects, setProjects] = useState([]);
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
    }, [portfolio]);
    const stats = useMemo(() => ({
        repositories: portfolio?.repositories?.length ?? 0,
        projects: portfolio?.projects?.length ?? 0,
        credentials: portfolio?.credentials?.length ?? 0,
        verifications: portfolio?.verificationLogs?.length ?? 0
    }), [portfolio]);
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
                        highlights: project.highlightsText
                            .split(/\r?\n/)
                            .map((item) => item.trim())
                            .filter(Boolean)
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
    const updateProject = (index, patch) => {
        setProjects((current) => current.map((project, projectIndex) => projectIndex === index ? { ...project, ...patch } : project));
    };
    const addProject = () => setProjects((current) => [...current, toProjectDraft(null)]);
    const removeProject = (index) => setProjects((current) => current.filter((_, projectIndex) => projectIndex !== index));
    return (_jsxs("div", { style: { display: "grid", gap: 24 }, children: [_jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)" }, children: [_jsx("p", { style: { margin: 0, color: "#93c5fd", fontSize: 13, letterSpacing: 1.2, textTransform: "uppercase" }, children: "Portfolio-first MVP" }), _jsx("h2", { style: { marginBottom: 12 }, children: "Verifiable developer portfolio dashboard" }), _jsx("p", { style: { maxWidth: 900, color: "#cbd5e1" }, children: "Edit your public bio, featured projects, and highlights here. Then sync GitHub evidence and issue recruiter-ready credentials that can be verified without trusting your database." }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 20 }, children: Object.entries(stats).map(([label, value]) => (_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }, children: label }), _jsx("div", { style: { fontSize: 28, fontWeight: 700 }, children: value })] }, label))) }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }, children: [_jsx("button", { onClick: refresh, children: "Refresh summary" }), userId ? _jsx("button", { onClick: () => void startGitHubOAuth(), children: "Connect GitHub" }) : null, userId ? _jsx("button", { onClick: () => void syncGitHub(), children: "Sync GitHub evidence" }) : null, userId ? _jsx("button", { onClick: () => void issuePortfolioCredentials(), children: "Issue portfolio credentials" }) : null, _jsx(Link, { to: "/portfolio/sjw-dev", children: "Open public portfolio" }), firstCredential ? _jsx(Link, { to: `/verify/${firstCredential.credential_jti}`, children: "Open recruiter verification" }) : null] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Edit public profile" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Bio, headline, slug, and featured projects shown to recruiters." })] }), _jsx("button", { disabled: saving || !userId, onClick: () => void saveDashboard(), children: saving ? "Saving…" : "Save dashboard" })] }), saveMessage ? _jsx("p", { style: { color: saveMessage.includes("saved") ? "#86efac" : "#fca5a5" }, children: saveMessage }) : null, error ? _jsx("p", { style: { color: "#fca5a5" }, children: error }) : null, _jsxs("div", { style: { display: "grid", gap: 12, marginTop: 16 }, children: [_jsx("input", { value: profileForm.displayName, onChange: (event) => setProfileForm((current) => ({ ...current, displayName: event.target.value })), placeholder: "Display name" }), _jsx("input", { value: profileForm.headline, onChange: (event) => setProfileForm((current) => ({ ...current, headline: event.target.value })), placeholder: "Headline" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: profileForm.location, onChange: (event) => setProfileForm((current) => ({ ...current, location: event.target.value })), placeholder: "Location" }), _jsx("input", { value: profileForm.portfolioSlug, onChange: (event) => setProfileForm((current) => ({ ...current, portfolioSlug: event.target.value })), placeholder: "Portfolio slug" })] }), _jsx("textarea", { rows: 5, value: profileForm.bio, onChange: (event) => setProfileForm((current) => ({ ...current, bio: event.target.value })), placeholder: "Short recruiter-facing bio" })] })] }), _jsxs("section", { style: { padding: 24, border: "1px solid #24324f", borderRadius: 20, background: "#111830" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }, children: [_jsxs("div", { children: [_jsx("h3", { style: { margin: 0 }, children: "Featured projects and highlights" }), _jsx("p", { style: { color: "#94a3b8" }, children: "Curate the story first; raw repositories are supporting evidence." })] }), _jsx("button", { onClick: addProject, children: "Add project" })] }), _jsx("div", { style: { display: "grid", gap: 16, marginTop: 16 }, children: projects.map((project, index) => (_jsxs("div", { style: { padding: 16, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }, children: [_jsxs("strong", { children: ["Project ", index + 1] }), _jsx("button", { onClick: () => removeProject(index), children: "Remove" })] }), _jsxs("div", { style: { display: "grid", gap: 10, marginTop: 12 }, children: [_jsx("input", { value: project.name, onChange: (event) => updateProject(index, { name: event.target.value }), placeholder: "Project name" }), _jsx("textarea", { rows: 3, value: project.description, onChange: (event) => updateProject(index, { description: event.target.value }), placeholder: "What this project proves" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }, children: [_jsx("input", { value: project.repoUrl, onChange: (event) => updateProject(index, { repoUrl: event.target.value }), placeholder: "Repository URL" }), _jsx("input", { value: project.liveUrl, onChange: (event) => updateProject(index, { liveUrl: event.target.value }), placeholder: "Live/demo URL" })] }), _jsx("textarea", { rows: 4, value: project.highlightsText, onChange: (event) => updateProject(index, { highlightsText: event.target.value }), placeholder: "One highlight per line" }), _jsxs("label", { style: { display: "flex", gap: 8, alignItems: "center" }, children: [_jsx("input", { type: "checkbox", checked: project.featured, onChange: (event) => updateProject(index, { featured: event.target.checked }) }), "Mark as featured"] })] })] }, `${project.name}-${index}`))) })] }), _jsxs("section", { style: { padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Live API summary" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data, null, 2) })] })] }));
}
