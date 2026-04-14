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
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }}>
        <p style={{ margin: 0, color: "#fbbf24", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }}>Legacy compatibility zone</p>
        <h2 style={{ marginTop: 12 }}>Legacy RBAC demo tools</h2>
        <p style={{ maxWidth: 860, color: "#cbd5e1" }}>
          These routes remain in the repository because the codebase started as a DID/VC RBAC login demo. They are still useful as technical reference tools,
          but they are no longer the main product story.
        </p>
        <p style={{ color: "#94a3b8" }}>
          If you are evaluating the current product direction, focus on the portfolio dashboard, public portfolio, and recruiter verification pages first.
        </p>
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        {tools.map((tool) => (
          <div key={tool.to} style={{ padding: 18, borderRadius: 16, background: "#0b1020", border: "1px solid #24324f" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: 18 }}>{tool.title}</strong>
                <p style={{ marginBottom: 0, color: "#cbd5e1" }}>{tool.description}</p>
              </div>
              <Link to={tool.to}>Open tool</Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
