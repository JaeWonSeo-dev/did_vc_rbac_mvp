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
  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: 24, background: "#0b1020", minHeight: "100vh", color: "#eef2ff" }}>
      <h1>Verifiable Developer Portfolio MVP</h1>
      <p style={{ maxWidth: 860, color: "#cbd5e1" }}>
        A DID/VC portfolio product for developers: edit your story, sync GitHub evidence, issue verifiable credentials, and give recruiters a verification page that clearly shows issuer, signature validity, status, and expiry.
      </p>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {primaryLinks.map(([to, label]) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({ color: isActive ? "#4ade80" : "#cbd5e1" })}>{label}</NavLink>
        ))}
      </nav>
      <details style={{ marginBottom: 24, color: "#94a3b8" }}>
        <summary>Legacy RBAC demo surfaces</summary>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
          {legacyLinks.map(([to, label]) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({ color: isActive ? "#fbbf24" : "#94a3b8" })}>{label}</NavLink>
          ))}
        </div>
      </details>
      <Outlet />
    </div>
  );
}
