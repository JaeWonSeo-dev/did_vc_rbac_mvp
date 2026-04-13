import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export function GitHubCallbackPage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const url = new URL(window.location.href);
        const query = url.searchParams.toString();
        fetch(`/api/github/oauth/callback?${query}`, { credentials: "include" })
            .then(async (response) => {
            const json = await response.json();
            if (!response.ok)
                throw new Error(json.error || "callback failed");
            setData(json);
        })
            .catch((e) => setError(e.message));
    }, []);
    if (error)
        return _jsx("p", { style: { color: "#fca5a5" }, children: error });
    if (!data)
        return _jsx("p", { children: "Processing GitHub OAuth callback\u2026" });
    return (_jsxs("section", { style: { padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "GitHub OAuth callback" }), _jsx("p", { children: data.message }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data, null, 2) })] }));
}
