import { useEffect, useState } from "react";
import { api } from "../lib/api";
export function useSummary() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const refresh = async () => {
        try {
            setData(await api('/api/system/summary'));
            setError(null);
        }
        catch (e) {
            setError(e.message);
        }
    };
    useEffect(() => { void refresh(); }, []);
    return { data, error, refresh };
}
