import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet } from "react-router-dom";
const primaryLinks = [
    ["/", "Dashboard"],
    ["/portfolio/sjw-dev", "Public Portfolio"]
];
export function Layout() {
    return (_jsxs("div", { style: { fontFamily: "Inter, sans-serif", padding: 24, background: "#0b1020", minHeight: "100vh", color: "#eef2ff" }, children: [_jsxs("div", { style: { display: "grid", gap: 18, marginBottom: 24 }, children: [_jsxs("div", { style: { padding: 24, borderRadius: 22, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }, children: [_jsx("p", { style: { margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }, children: "Portfolio-first product" }), _jsx("h1", { style: { marginBottom: 10 }, children: "Verifiable Developer Portfolio MVP" }), _jsx("p", { style: { maxWidth: 860, color: "#cbd5e1", marginBottom: 16 }, children: "Not just a GitHub link. This product lets a developer turn GitHub activity, project history, and achievement evidence into issuer-reviewed verifiable credentials that recruiters can inspect and verify immediately." }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [primaryLinks.map(([to, label]) => (_jsx(NavLink, { to: to, style: ({ isActive }) => ({
                                            color: isActive ? "#08111f" : "#e2e8f0",
                                            background: isActive ? "#4ade80" : "#0b1020",
                                            border: "1px solid #24324f",
                                            padding: "10px 14px",
                                            borderRadius: 999,
                                            textDecoration: "none",
                                            fontWeight: 700
                                        }), children: label }, to))), _jsx(NavLink, { to: "/portfolio/sjw-dev", style: ({ isActive }) => ({
                                            color: isActive ? "#08111f" : "#e2e8f0",
                                            background: isActive ? "#93c5fd" : "#0b1020",
                                            border: "1px solid #24324f",
                                            padding: "10px 14px",
                                            borderRadius: 999,
                                            textDecoration: "none",
                                            fontWeight: 700
                                        }), children: "Recruiter View" }), _jsx(NavLink, { to: "/legacy", style: ({ isActive }) => ({
                                            color: isActive ? "#111827" : "#fbbf24",
                                            background: isActive ? "#fbbf24" : "transparent",
                                            border: "1px solid #7c5a14",
                                            padding: "10px 14px",
                                            borderRadius: 999,
                                            textDecoration: "none",
                                            fontWeight: 700
                                        }), children: "Legacy Tools" })] })] }), _jsxs("div", { style: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }, children: [_jsxs("div", { style: { padding: 14, borderRadius: 16, background: "#111830", border: "1px solid #24324f", color: "#94a3b8" }, children: [_jsx("strong", { style: { color: "#e2e8f0" }, children: "Recommended demo order" }), _jsx("div", { style: { marginTop: 8 }, children: "1) Dashboard \u2192 2) Public Portfolio \u2192 3) Recruiter verification link inside a credential card." })] }), _jsxs("div", { style: { padding: 14, borderRadius: 16, background: "#111830", border: "1px solid #24324f", color: "#94a3b8" }, children: ["The original RBAC demo surfaces still exist for compatibility, but they now live behind a separate ", _jsx("strong", { style: { color: "#fbbf24" }, children: "Legacy Tools" }), " entry so the main product narrative stays portfolio-first."] })] })] }), _jsx(Outlet, {})] }));
}
