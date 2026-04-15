import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
const tools = [
    {
        to: "/issuer",
        title: "Legacy issuer",
        description: "Original RBAC credential issuer surface kept for backwards compatibility and low-level VC experiments."
    },
    {
        to: "/wallet",
        title: "Legacy wallet",
        description: "Holder wallet import / presentation flow from the original admin-login demo."
    },
    {
        to: "/verifier",
        title: "Legacy verifier",
        description: "Verifier request and VP submission flow for the older RBAC login narrative."
    },
    {
        to: "/admin",
        title: "Protected admin console",
        description: "Original protected route demo for admin authorization."
    },
    {
        to: "/audit",
        title: "Protected audit console",
        description: "Original protected route demo for auditor authorization."
    },
    {
        to: "/dev",
        title: "Protected developer console",
        description: "Original protected route demo for developer authorization."
    }
];
export function LegacyToolsPage() {
    return (_jsxs("div", { style: { display: "grid", gap: 20 }, children: [_jsxs("section", { style: { padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("p", { style: { margin: 0, color: "#fbbf24", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }, children: "Legacy compatibility zone" }), _jsx("h2", { style: { marginTop: 12 }, children: "Legacy RBAC demo tools" }), _jsx("p", { style: { maxWidth: 860, color: "#cbd5e1" }, children: "These routes remain in the repository because the codebase started as a DID/VC RBAC login demo. They are still useful as technical reference tools, but they are no longer the main product story." }), _jsx("p", { style: { color: "#94a3b8" }, children: "If you are evaluating the current product direction, focus on the portfolio dashboard, public portfolio, and recruiter verification pages first." })] }), _jsx("section", { style: { display: "grid", gap: 16 }, children: tools.map((tool) => (_jsx("div", { style: { padding: 18, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }, children: _jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }, children: [_jsxs("div", { children: [_jsx("strong", { style: { fontSize: 18 }, children: tool.title }), _jsx("p", { style: { marginBottom: 0, color: "#cbd5e1" }, children: tool.description })] }), _jsx(Link, { to: tool.to, children: "Open tool" })] }) }, tool.to))) })] }));
}
