import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet } from "react-router-dom";
const links = [
    ["/", "Overview"],
    ["/issuer", "Issuer"],
    ["/wallet", "Wallet"],
    ["/verifier", "Verifier"],
    ["/admin", "Admin"],
    ["/audit", "Audit"],
    ["/dev", "Dev"]
];
export function Layout() {
    return (_jsxs("div", { style: { fontFamily: 'Inter, sans-serif', padding: 24, background: '#0b1020', minHeight: '100vh', color: '#eef2ff' }, children: [_jsx("h1", { children: "DID Admin Console + VC RBAC MVP" }), _jsx("nav", { style: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }, children: links.map(([to, label]) => (_jsx(NavLink, { to: to, style: ({ isActive }) => ({ color: isActive ? '#4ade80' : '#cbd5e1' }), children: label }, to))) }), _jsx(Outlet, {})] }));
}
