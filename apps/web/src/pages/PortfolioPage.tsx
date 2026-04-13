import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";

export function PortfolioPage() {
  const { slug = "sjw-dev" } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api(`/api/portfolio/${slug}`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;
  if (!data) return <p>Loading portfolio…</p>;

  const { profile, github, projects, credentials } = data;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section style={{ padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }}>
        <h2 style={{ marginTop: 0 }}>{profile.display_name}</h2>
        <p>{profile.headline}</p>
        <p>{profile.bio}</p>
        <ul>
          <li>DID: {profile.did}</li>
          <li>Location: {profile.location}</li>
          <li>GitHub: {github?.username ? <a href={github.profile_url} target="_blank" rel="noreferrer">@{github.username}</a> : "pending link"}</li>
        </ul>
      </section>

      <section style={{ padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Featured projects</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {projects.map((project: any) => (
            <div key={project.id} style={{ padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }}>
              <strong>{project.name}</strong>
              <p>{project.description}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {project.repo_url ? <a href={project.repo_url} target="_blank" rel="noreferrer">Repository</a> : null}
                {project.live_url ? <a href={project.live_url} target="_blank" rel="noreferrer">Live</a> : null}
              </div>
              {project.highlights?.length ? <ul>{project.highlights.map((item: string) => <li key={item}>{item}</li>)}</ul> : null}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }}>
        <h3 style={{ marginTop: 0 }}>Verifiable credentials</h3>
        <div style={{ display: "grid", gap: 16 }}>
          {credentials.map((credential: any) => (
            <div key={credential.credential_jti} style={{ padding: 16, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }}>
              <strong>{credential.credential_type}</strong>
              <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(credential.summary, null, 2)}</pre>
              <Link to={`/verify/${credential.credential_jti}`}>Verify this credential</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
