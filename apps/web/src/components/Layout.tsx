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
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', padding: 24, background: '#0b1020', minHeight: '100vh', color: '#eef2ff' }}>
      <h1>DID Admin Console + VC RBAC MVP</h1>
      <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({ color: isActive ? '#4ade80' : '#cbd5e1' })}>{label}</NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
