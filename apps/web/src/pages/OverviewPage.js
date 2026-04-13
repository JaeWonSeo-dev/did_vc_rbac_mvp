import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";
export function OverviewPage() {
    const { data, error, refresh } = useSummary();
    const portfolio = data?.portfolio;
    const firstCredential = portfolio?.credentials?.[0];
    const userId = portfolio?.profile?.id;
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
    return (_jsxs("div", { style: { display: "grid", gap: 24 }, children: [_jsxs("section", { style: { padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Verifiable developer portfolio dashboard" }), _jsx("p", { children: "This MVP now supports GitHub OAuth bootstrap, GitHub API sync for profile and repositories, persisted portfolio evidence, and issuance of the two portfolio VC types." }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx("button", { onClick: refresh, children: "Refresh API summary" }), userId ? _jsx("button", { onClick: () => void startGitHubOAuth(), children: "Connect GitHub" }) : null, userId ? _jsx("button", { onClick: () => void syncGitHub(), children: "Sync GitHub evidence" }) : null, userId ? _jsx("button", { onClick: () => void issuePortfolioCredentials(), children: "Issue portfolio credentials" }) : null, _jsx(Link, { to: "/portfolio/sjw-dev", children: "Open demo portfolio" }), firstCredential ? _jsx(Link, { to: `/verify/${firstCredential.credential_jti}`, children: "Open recruiter verification" }) : null] })] }), _jsxs("section", { style: { padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Live summary" }), error ? _jsx("p", { style: { color: "#fca5a5" }, children: error }) : null, _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data, null, 2) })] }), portfolio ? (_jsxs("section", { style: { padding: 20, border: "1px solid #24324f", borderRadius: 16, background: "#111830" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Demo portfolio snapshot" }), _jsxs("p", { children: [_jsx("strong", { children: portfolio.profile.display_name }), " \u00B7 ", portfolio.profile.headline] }), _jsx("p", { children: portfolio.profile.bio }), _jsxs("ul", { children: [_jsxs("li", { children: ["GitHub: ", portfolio.github?.username ?? "not linked"] }), _jsxs("li", { children: ["Repositories synced: ", portfolio.repositories?.length ?? 0] }), _jsxs("li", { children: ["Projects: ", portfolio.projects?.length ?? 0] }), _jsxs("li", { children: ["Credentials: ", portfolio.credentials?.length ?? 0] })] })] })) : null] }));
}
