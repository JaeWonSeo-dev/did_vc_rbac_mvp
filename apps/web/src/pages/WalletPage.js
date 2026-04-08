import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../lib/api";
import { useSummary } from "../hooks/useSummary";
export function WalletPage() {
    const { data, refresh } = useSummary();
    const [passphrase, setPassphrase] = useState('demo-passphrase');
    const [selectedDid, setSelectedDid] = useState('');
    const [vcJwt, setVcJwt] = useState('');
    const [requestJson, setRequestJson] = useState('');
    const [credentialJti, setCredentialJti] = useState('');
    const [vp, setVp] = useState(null);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Wallet" }), _jsx("input", { value: passphrase, onChange: (e) => setPassphrase(e.target.value), placeholder: "passphrase" }), _jsx("button", { onClick: async () => { const wallet = await api('/api/wallets', { method: 'POST', body: JSON.stringify({ passphrase }) }); setSelectedDid(wallet.did); refresh(); }, children: "Create Holder DID" }), _jsx("div", { children: _jsxs("select", { value: selectedDid, onChange: (e) => setSelectedDid(e.target.value), children: [_jsx("option", { value: "", children: "Select wallet" }), data?.wallets?.map((w) => _jsx("option", { value: w.did, children: w.did }, w.did))] }) }), _jsx("textarea", { placeholder: "VC JWT", value: vcJwt, onChange: (e) => setVcJwt(e.target.value), rows: 5, style: { width: '100%' } }), _jsx("button", { onClick: async () => { await api(`/api/wallets/${encodeURIComponent(selectedDid)}/import`, { method: 'POST', body: JSON.stringify({ passphrase, vcJwt }) }); refresh(); }, children: "Import VC" }), _jsx("h3", { children: "Presentation Request" }), _jsx("textarea", { placeholder: "auth request JSON", value: requestJson, onChange: (e) => setRequestJson(e.target.value), rows: 8, style: { width: '100%' } }), _jsx("input", { placeholder: "credential jti", value: credentialJti, onChange: (e) => setCredentialJti(e.target.value), style: { width: '100%' } }), _jsx("button", { onClick: async () => { const request = JSON.parse(requestJson); const result = await api(`/api/wallets/${encodeURIComponent(selectedDid)}/present`, { method: 'POST', body: JSON.stringify({ passphrase, credentialJti, request }) }); setVp(result); }, children: "Create VP" }), _jsx("pre", { children: JSON.stringify(vp, null, 2) }), _jsx("h3", { children: "Wallet Credentials" }), _jsx("pre", { children: JSON.stringify(data, null, 2) })] }));
}
