import { getSession } from "../modules/verifier/service";
export function sessionMiddleware(db, config) {
    return (req, res, next) => {
        const sessionId = req.cookies?.[config.cookieName];
        if (sessionId) {
            const session = getSession(db, sessionId);
            if (session) {
                req.session = session;
            }
        }
        next();
    };
}
export function requireSession(role) {
    return (req, res, next) => {
        const session = req.session;
        if (!session)
            return res.status(401).json({ error: "Authentication required" });
        if (role && session.role !== role) {
            return res.status(403).json({ error: "Access denied", reason: "insufficient role" });
        }
        next();
    };
}
export function requireCsrf(config) {
    return (req, res, next) => {
        const session = req.session;
        if (!session)
            return res.status(401).json({ error: "Authentication required" });
        const headerValue = req.header(config.csrfHeaderName);
        if (!headerValue || headerValue !== session.csrf_token) {
            return res.status(403).json({ error: "CSRF validation failed" });
        }
        next();
    };
}
