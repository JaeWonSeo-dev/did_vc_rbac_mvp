import { NavLink, Outlet } from "react-router-dom";

const primaryLinks = [
  ["/", "Dashboard"],
  ["/portfolio/sjw-dev", "Public Portfolio"]
];

export function Layout() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: 24, background: "#0b1020", minHeight: "100vh", color: "#eef2ff" }}>
      <div style={{ display: "grid", gap: 18, marginBottom: 24 }}>
        <div style={{ padding: 24, borderRadius: 22, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }}>
          <p style={{ margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }}>Portfolio-first product</p>
          <h1 style={{ marginBottom: 10 }}>Verifiable Developer Portfolio MVP</h1>
          <p style={{ maxWidth: 860, color: "#cbd5e1", marginBottom: 16 }}>
            A DID/VC portfolio product for developers: edit your story, sync GitHub evidence, issue verifiable credentials, and give recruiters a verification page that clearly shows issuer, signature validity, status, and expiry.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {primaryLinks.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  color: isActive ? "#08111f" : "#e2e8f0",
                  background: isActive ? "#4ade80" : "#0b1020",
                  border: "1px solid #24324f",
                  padding: "10px 14px",
                  borderRadius: 999,
                  textDecoration: "none",
                  fontWeight: 700
                })}
              >
                {label}
              </NavLink>
            ))}
            <NavLink
              to="/legacy"
              style={({ isActive }) => ({
                color: isActive ? "#111827" : "#fbbf24",
                background: isActive ? "#fbbf24" : "transparent",
                border: "1px solid #7c5a14",
                padding: "10px 14px",
                borderRadius: 999,
                textDecoration: "none",
                fontWeight: 700
              })}
            >
              Legacy Tools
            </NavLink>
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 16, background: "#111830", border: "1px solid #24324f", color: "#94a3b8" }}>
          The original RBAC demo surfaces still exist for compatibility, but they now live behind a separate <strong style={{ color: "#fbbf24" }}>Legacy Tools</strong> entry so the main product narrative stays portfolio-first.
        </div>
      </div>
      <Outlet />
    </div>
  );
}
