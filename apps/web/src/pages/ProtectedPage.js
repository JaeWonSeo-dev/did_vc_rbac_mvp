import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
export function ProtectedPage({ title, endpoint }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => { api(endpoint).then(setData).catch((e) => setError(e.message)); }, [endpoint]);
    return _jsxs("div", { children: [_jsx("h2", { children: title }), error ? _jsx("p", { children: error }) : _jsx("pre", { children: JSON.stringify(data, null, 2) })] });
}
