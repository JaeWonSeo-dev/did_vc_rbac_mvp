import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";
export function IssuerPage() {
    const { data, refresh } = useSummary();
    const [subjectDid, setSubjectDid] = useState('');
    const [role, setRole] = useState('Admin');
    const [expiresInSeconds, setExpiresInSeconds] = useState(3600);
    const [issued, setIssued] = useState(null);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Issuer" }), _jsx("input", { placeholder: "subject DID", value: subjectDid, onChange: (e) => setSubjectDid(e.target.value), style: { width: 500 } }), _jsxs("select", { value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { children: "Admin" }), _jsx("option", { children: "Auditor" }), _jsx("option", { children: "Developer" })] }), _jsx("input", { type: "number", value: expiresInSeconds, onChange: (e) => setExpiresInSeconds(Number(e.target.value)) }), _jsx("button", { onClick: async () => { const res = await api('/api/issuer/credentials', { method: 'POST', body: JSON.stringify({ subjectDid, role, expiresInSeconds }) }); setIssued(res); refresh(); }, children: "Issue VC" }), _jsx("pre", { children: JSON.stringify(issued, null, 2) }), _jsx("h3", { children: "Issued Credentials" }), data?.credentials?.map((item) => (_jsxs("div", { style: { border: '1px solid #334155', padding: 12, marginBottom: 8 }, children: [_jsxs("div", { children: [item.role, " / ", item.subject_did] }), _jsxs("div", { children: ["Status: ", item.status] }), _jsx("button", { onClick: async () => { await api(`/api/issuer/credentials/${item.jti}/status`, { method: 'POST', body: JSON.stringify({ status: 'suspended', reason: 'manual suspend' }) }); refresh(); }, children: "Suspend" }), _jsx("button", { onClick: async () => { await api(`/api/issuer/credentials/${item.jti}/status`, { method: 'POST', body: JSON.stringify({ status: 'revoked', reason: 'manual revoke' }) }); refresh(); }, children: "Revoke" })] }, item.jti)))] }));
}
