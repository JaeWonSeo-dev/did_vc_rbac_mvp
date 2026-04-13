import { useEffect, useState } from "react";

export function GitHubCallbackPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const query = url.searchParams.toString();
    fetch(`/api/github/oauth/callback?${query}`, { credentials: "include" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "callback failed");
        setData(json);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: "#fca5a5" }}>{error}</p>;
  if (!data) return <p>Processing GitHub OAuth callback…</p>;

  return (
    <section style={{ padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }}>
      <h2 style={{ marginTop: 0 }}>GitHub OAuth callback</h2>
      <p>{data.message}</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
