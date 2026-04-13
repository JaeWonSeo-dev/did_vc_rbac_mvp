import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
function fmtDate(seconds) {
    if (!seconds)
        return "No expiry";
    return new Date(seconds * 1000).toLocaleString();
}
export function VerifyCredentialPage() {
    const { jti = "demo" } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        api(`/api/verify/${jti}`)
            .then(setData)
            .catch((e) => setError(e.message));
    }, [jti]);
    const expiryState = useMemo(() => {
        if (!data?.expiresAt)
            return { label: "No expiry", color: "#4ade80" };
        return data.expiresAt * 1000 > Date.now()
            ? { label: "Not expired", color: "#4ade80" }
            : { label: "Expired", color: "#fca5a5" };
    }, [data]);
    if (error)
        return _jsx("p", { style: { color: "#fca5a5" }, children: error });
    if (!data)
        return _jsx("p", { children: "Verifying credential\u2026" });
    return (_jsxs("div", { style: { display: "grid", gap: 20 }, children: [_jsxs("section", { style: { padding: 24, borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }, children: [_jsx("p", { style: { margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }, children: "Recruiter verification" }), _jsx("h2", { style: { marginTop: 12, marginBottom: 12 }, children: "Credential verification result" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }, children: [_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Signature" }), _jsx("div", { style: { color: data.ok ? "#4ade80" : "#fca5a5", fontWeight: 700 }, children: data.ok ? "Verified" : "Invalid" })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Registry status" }), _jsx("div", { style: { color: data.status === "active" ? "#4ade80" : "#fbbf24", fontWeight: 700 }, children: data.status })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Expiry" }), _jsx("div", { style: { color: expiryState.color, fontWeight: 700 }, children: expiryState.label }), _jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: fmtDate(data.expiresAt) })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Issuer" }), _jsx("div", { style: { fontWeight: 700 }, children: data.issuerDid }), _jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: data.credentialType })] })] }), _jsxs("ul", { style: { marginTop: 18 }, children: [_jsxs("li", { children: ["Credential type: ", data.credentialType] }), _jsxs("li", { children: ["Subject DID: ", data.subjectDid] }), _jsxs("li", { children: ["Portfolio: ", data.portfolioSlug ? _jsx(Link, { to: `/portfolio/${data.portfolioSlug}`, children: data.portfolioSlug }) : "n/a"] })] })] }), _jsxs("section", { style: { padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Recruiter-readable summary" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data.summary, null, 2) })] }), _jsxs("section", { style: { padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Verified claims" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data.claims, null, 2) })] })] }));
}
