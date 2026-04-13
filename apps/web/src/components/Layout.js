import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet } from "react-router-dom";
const links = [
    ["/", "Overview"],
    ["/portfolio/sjw-dev", "Portfolio"],
    ["/verify/demo", "Verify"],
    ["/issuer", "Legacy Issuer"],
    ["/wallet", "Legacy Wallet"],
    ["/verifier", "Legacy Verifier"]
];
export function Layout() {
    return (_jsxs("div", { style: { fontFamily: "Inter, sans-serif", padding: 24, background: "#0b1020", minHeight: "100vh", color: "#eef2ff" }, children: [_jsx("h1", { children: "Verifiable Developer Portfolio MVP" }), _jsx("p", { style: { maxWidth: 860, color: "#cbd5e1" }, children: "Refactoring the original DID/VC RBAC demo into a recruiter-friendly portfolio service where GitHub identity and contribution claims can be published and verified." }), _jsx("nav", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }, children: links.map(([to, label]) => (_jsx(NavLink, { to: to, style: ({ isActive }) => ({ color: isActive ? "#4ade80" : "#cbd5e1" }), children: label }, to))) }), _jsx(Outlet, {})] }));
}
