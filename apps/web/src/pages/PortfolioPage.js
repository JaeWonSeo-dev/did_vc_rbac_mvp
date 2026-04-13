import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
export function PortfolioPage() {
    const { slug = "sjw-dev" } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        api(`/api/portfolio/${slug}`)
            .then(setData)
            .catch((e) => setError(e.message));
    }, [slug]);
    if (error)
        return _jsx("p", { style: { color: "#fca5a5" }, children: error });
    if (!data)
        return _jsx("p", { children: "Loading portfolio\u2026" });
    const { profile, github, projects, credentials } = data;
    return (_jsxs("div", { style: { display: "grid", gap: 20 }, children: [_jsxs("section", { style: { padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h2", { style: { marginTop: 0 }, children: profile.display_name }), _jsx("p", { children: profile.headline }), _jsx("p", { children: profile.bio }), _jsxs("ul", { children: [_jsxs("li", { children: ["DID: ", profile.did] }), _jsxs("li", { children: ["Location: ", profile.location] }), _jsxs("li", { children: ["GitHub: ", github?.username ? _jsxs("a", { href: github.profile_url, target: "_blank", rel: "noreferrer", children: ["@", github.username] }) : "pending link"] })] })] }), _jsxs("section", { style: { padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Featured projects" }), _jsx("div", { style: { display: "grid", gap: 16 }, children: projects.map((project) => (_jsxs("div", { style: { padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("strong", { children: project.name }), _jsx("p", { children: project.description }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [project.repo_url ? _jsx("a", { href: project.repo_url, target: "_blank", rel: "noreferrer", children: "Repository" }) : null, project.live_url ? _jsx("a", { href: project.live_url, target: "_blank", rel: "noreferrer", children: "Live" }) : null] }), project.highlights?.length ? _jsx("ul", { children: project.highlights.map((item) => _jsx("li", { children: item }, item)) }) : null] }, project.id))) })] }), _jsxs("section", { style: { padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Verifiable credentials" }), _jsx("div", { style: { display: "grid", gap: 16 }, children: credentials.map((credential) => (_jsxs("div", { style: { padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("strong", { children: credential.credential_type }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(credential.summary, null, 2) }), _jsx(Link, { to: `/verify/${credential.credential_jti}`, children: "Verify this credential" })] }, credential.credential_jti))) })] })] }));
}
