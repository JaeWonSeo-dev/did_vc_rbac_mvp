import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../lib/api";
export function VerifierPage() {
    const [targetPath, setTargetPath] = useState('/admin');
    const [authRequest, setAuthRequest] = useState(null);
    const [vpToken, setVpToken] = useState('');
    const [result, setResult] = useState(null);
    return (_jsxs("div", { children: [_jsx("h2", { children: "Verifier" }), _jsxs("select", { value: targetPath, onChange: (e) => setTargetPath(e.target.value), children: [_jsx("option", { children: "/admin" }), _jsx("option", { children: "/audit" }), _jsx("option", { children: "/dev" })] }), _jsx("button", { onClick: async () => setAuthRequest(await api('/api/verifier/request', { method: 'POST', body: JSON.stringify({ targetPath }) })), children: "Start Login" }), _jsx("pre", { children: JSON.stringify(authRequest, null, 2) }), _jsx("textarea", { placeholder: "VP JWT", value: vpToken, onChange: (e) => setVpToken(e.target.value), rows: 8, style: { width: '100%' } }), _jsx("button", { onClick: async () => { if (!authRequest)
                    return; try {
                    setResult(await api('/api/verifier/direct-post', { method: 'POST', body: JSON.stringify({ vp_token: vpToken, state: authRequest.state }) }));
                }
                catch (e) {
                    setResult({ error: e.message });
                } }, children: "Submit VP" }), _jsx("pre", { children: JSON.stringify(result, null, 2) })] }));
}
