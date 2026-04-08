import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSummary } from "../hooks/useSummary";
export function OverviewPage() {
    const { data, refresh } = useSummary();
    return (_jsxs("div", { children: [_jsx("button", { onClick: refresh, children: "Refresh" }), _jsx("pre", { children: JSON.stringify(data, null, 2) })] }));
}
