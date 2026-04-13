import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
export function VerifyCredentialPage() {
    const { jti = "demo" } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        api(`/api/verify/${jti}`)
            .then(setData)
            .catch((e) => setError(e.message));
    }, [jti]);
    if (error)
        return _jsx("p", { style: { color: "#fca5a5" }, children: error });
    if (!data)
        return _jsx("p", { children: "Verifying credential\u2026" });
    return (_jsxs("div", { style: { display: "grid", gap: 20 }, children: [_jsxs("section", { style: { padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Recruiter verification result" }), _jsxs("p", { children: ["Status: ", _jsx("strong", { style: { color: data.ok ? "#4ade80" : "#fca5a5" }, children: data.ok ? "valid" : "invalid" })] }), _jsxs("ul", { children: [_jsxs("li", { children: ["Credential type: ", data.credentialType] }), _jsxs("li", { children: ["Issuer DID: ", data.issuerDid] }), _jsxs("li", { children: ["Subject DID: ", data.subjectDid] }), _jsxs("li", { children: ["Registry status: ", data.status] }), _jsxs("li", { children: ["Portfolio: ", data.portfolioSlug ? _jsx(Link, { to: `/portfolio/${data.portfolioSlug}`, children: data.portfolioSlug }) : "n/a"] })] })] }), _jsxs("section", { style: { padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Credential summary" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data.summary, null, 2) })] }), _jsxs("section", { style: { padding: 20, borderRadius: 16, background: "#111830", border: "1px solid #24324f" }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Verified claims" }), _jsx("pre", { style: { whiteSpace: "pre-wrap" }, children: JSON.stringify(data.claims, null, 2) })] })] }));
}
