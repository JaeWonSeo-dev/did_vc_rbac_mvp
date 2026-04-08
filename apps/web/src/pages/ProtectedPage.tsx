import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function ProtectedPage({ title, endpoint }: { title: string; endpoint: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api(endpoint).then(setData).catch((e) => setError(e.message)); }, [endpoint]);
  return <div><h2>{title}</h2>{error ? <p>{error}</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}</div>;
}
