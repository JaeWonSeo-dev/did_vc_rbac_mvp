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
  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: 24, background: "#0b1020", minHeight: "100vh", color: "#eef2ff" }}>
      <h1>Verifiable Developer Portfolio MVP</h1>
      <p style={{ maxWidth: 860, color: "#cbd5e1" }}>
        Refactoring the original DID/VC RBAC demo into a recruiter-friendly portfolio service where GitHub identity and contribution claims can be published and verified.
      </p>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({ color: isActive ? "#4ade80" : "#cbd5e1" })}>{label}</NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
