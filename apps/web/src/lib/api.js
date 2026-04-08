export async function api(url, init) {
    const response = await fetch(url, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {})
        },
        ...init
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.reason || body.error || "request failed");
    }
    return response.json();
}
