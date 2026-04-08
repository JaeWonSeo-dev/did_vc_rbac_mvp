import { useSummary } from "../hooks/useSummary";

export function OverviewPage() {
  const { data, refresh } = useSummary();
  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
