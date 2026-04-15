import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
function fmtDate(seconds) {
    if (!seconds)
        return "No expiry";
    return new Date(seconds * 1000).toLocaleString();
}
function toTitle(value) {
    return String(value ?? "").replace(/([a-z])([A-Z])/g, "$1 $2");
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
            return { label: "No expiry", color: "#4ade80", summary: "This credential does not currently carry an expiration date." };
        return data.expiresAt * 1000 > Date.now()
            ? { label: "Not expired", color: "#4ade80", summary: "The credential is still within its declared validity window." }
            : { label: "Expired", color: "#fca5a5", summary: "The credential has passed its expiry date and should be re-issued before relying on it." };
    }, [data]);
    const decision = useMemo(() => {
        if (!data?.ok) {
            return {
                label: "Do not trust",
                color: "#fca5a5",
                background: "rgba(127, 29, 29, 0.35)",
                summary: "Signature verification failed or the credential could not be resolved from the issuer registry."
            };
        }
        if (data.status === "revoked") {
            return {
                label: "Invalidated by issuer",
                color: "#fca5a5",
                background: "rgba(127, 29, 29, 0.35)",
                summary: "The issuer revoked this credential. Recruiters should not rely on it as current proof."
            };
        }
        if (data.status === "suspended") {
            return {
                label: "Temporarily on hold",
                color: "#fbbf24",
                background: "rgba(120, 53, 15, 0.35)",
                summary: "The issuer temporarily suspended this credential pending review or clarification."
            };
        }
        if (data.expiresAt && data.expiresAt * 1000 <= Date.now()) {
            return {
                label: "Expired credential",
                color: "#fca5a5",
                background: "rgba(127, 29, 29, 0.35)",
                summary: "The signature is valid, but the credential is outside its validity period."
            };
        }
        return {
            label: "Verified and active",
            color: "#4ade80",
            background: "rgba(20, 83, 45, 0.35)",
            summary: "The signature is valid, the issuer registry marks it active, and the credential is still in date."
        };
    }, [data]);
    const summaryEntries = useMemo(() => {
        if (!data?.summary || typeof data.summary !== "object")
            return [];
        return Object.entries(data.summary);
    }, [data]);
    if (error)
        return _jsx("p", { style: { color: "#fca5a5" }, children: error });
    if (!data)
        return _jsx("p", { children: "Verifying credential\u2026" });
    return (_jsxs("div", { style: { display: "grid", gap: 20 }, children: [_jsxs("section", { style: { padding: 24, borderRadius: 20, background: "linear-gradient(135deg, #111830 0%, #16213d 100%)", border: "1px solid #24324f" }, children: [_jsx("p", { style: { margin: 0, color: "#93c5fd", fontSize: 13, textTransform: "uppercase", letterSpacing: 1.2 }, children: "Recruiter verification" }), _jsx("h2", { style: { marginTop: 12, marginBottom: 12 }, children: "Credential verification result" }), _jsxs("div", { style: { padding: 18, borderRadius: 18, background: decision.background, border: `1px solid ${decision.color}` }, children: [_jsx("div", { style: { fontSize: 12, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 1.2 }, children: "Decision" }), _jsx("div", { style: { fontSize: 28, fontWeight: 800, color: decision.color, marginTop: 6 }, children: decision.label }), _jsx("p", { style: { marginBottom: 0, color: "#e2e8f0" }, children: decision.summary })] }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }, children: [_jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Signature" }), _jsx("div", { style: { color: data.ok ? "#4ade80" : "#fca5a5", fontWeight: 700 }, children: data.ok ? "Verified" : "Invalid" })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Registry status" }), _jsx("div", { style: { color: data.status === "active" ? "#4ade80" : data.status === "revoked" ? "#fca5a5" : "#fbbf24", fontWeight: 700 }, children: data.status }), _jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: data.statusExplainer })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Expiry" }), _jsx("div", { style: { color: expiryState.color, fontWeight: 700 }, children: expiryState.label }), _jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: fmtDate(data.expiresAt) })] }), _jsxs("div", { style: { padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: "Issuer" }), _jsx("div", { style: { fontWeight: 700 }, children: data.issuerDid }), _jsx("div", { style: { color: "#94a3b8", fontSize: 13 }, children: data.credentialType })] })] }), _jsxs("div", { style: { marginTop: 18, padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0, marginBottom: 8 }, children: "How to read this page" }), _jsxs("ul", { style: { margin: 0, paddingLeft: 18, color: "#cbd5e1" }, children: [_jsxs("li", { children: [_jsx("strong", { children: "Signature:" }), " proves the credential payload was signed by the issuer DID."] }), _jsxs("li", { children: [_jsx("strong", { children: "Registry status:" }), " shows whether the issuer still considers the credential active."] }), _jsxs("li", { children: [_jsx("strong", { children: "Expiry:" }), " tells you whether the credential is still within its declared validity window."] }), _jsxs("li", { children: [_jsx("strong", { children: "Decision:" }), " combines signature, registry state, and expiry into one recruiter-facing judgment."] })] })] }), _jsxs("ul", { style: { marginTop: 18 }, children: [_jsxs("li", { children: ["Credential type: ", data.credentialType] }), _jsxs("li", { children: ["Subject DID: ", data.subjectDid] }), _jsxs("li", { children: ["Portfolio: ", data.portfolioSlug ? _jsx(Link, { to: `/portfolio/${data.portfolioSlug}`, children: data.portfolioSlug }) : "n/a"] }), _jsxs("li", { children: ["Expiry meaning: ", expiryState.summary] })] })] }), _jsxs("section", { style: { padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Recruiter-readable summary" }), data.summary?.narrative ? (_jsx("div", { style: { marginBottom: 14, padding: 16, borderRadius: 14, background: "#0b1020", border: "1px solid #24324f", color: "#e2e8f0" }, children: data.summary.narrative })) : null, summaryEntries.length ? (_jsx("div", { style: { display: "grid", gap: 12 }, children: summaryEntries.map(([key, value]) => (_jsxs("div", { style: { padding: 14, borderRadius: 12, background: "#0b1020", border: "1px solid #24324f" }, children: [_jsx("div", { style: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase" }, children: toTitle(key) }), _jsx("div", { style: { marginTop: 6, whiteSpace: "pre-wrap" }, children: Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value) })] }, key))) })) : _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data.summary, null, 2) })] }), _jsxs("section", { style: { padding: 24, borderRadius: 20, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Verified claims" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data.claims, null, 2) })] })] }));
}
