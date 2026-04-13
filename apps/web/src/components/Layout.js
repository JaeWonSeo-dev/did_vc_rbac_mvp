import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet } from "react-router-dom";
const primaryLinks = [
    ["/", "Dashboard"],
    ["/portfolio/sjw-dev", "Public Portfolio"]
];
const legacyLinks = [
    ["/issuer", "Issuer"],
    ["/wallet", "Wallet"],
    ["/verifier", "Verifier"],
    ["/admin", "Admin"],
    ["/audit", "Audit"],
    ["/dev", "Dev"]
];
export function Layout() {
    return (_jsxs("div", { style: { fontFamily: "Inter, sans-serif", padding: 24, background: "#0b1020", minHeight: "100vh", color: "#eef2ff" }, children: [_jsx("h1", { children: "Verifiable Developer Portfolio MVP" }), _jsx("p", { style: { maxWidth: 860, color: "#cbd5e1" }, children: "A DID/VC portfolio product for developers: edit your story, sync GitHub evidence, issue verifiable credentials, and give recruiters a verification page that clearly shows issuer, signature validity, status, and expiry." }), _jsx("nav", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }, children: primaryLinks.map(([to, label]) => (_jsx(NavLink, { to: to, style: ({ isActive }) => ({ color: isActive ? "#4ade80" : "#cbd5e1" }), children: label }, to))) }), _jsxs("details", { style: { marginBottom: 24, color: "#94a3b8" }, children: [_jsx("summary", { children: "Legacy RBAC demo surfaces" }), _jsx("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }, children: legacyLinks.map(([to, label]) => (_jsx(NavLink, { to: to, style: ({ isActive }) => ({ color: isActive ? "#fbbf24" : "#94a3b8" }), children: label }, to))) })] }), _jsx(Outlet, {})] }));
}
