export function writeAudit(db, entry) {
    db.prepare(`INSERT INTO audit_logs(event_type, outcome, summary_reason, detail_reason, holder_did, credential_jti, session_id, target_path, ip_address, user_agent, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(entry.eventType, entry.outcome, entry.summaryReason, entry.detailReason, entry.holderDid ?? null, entry.credentialJti ?? null, entry.sessionId ?? null, entry.targetPath ?? null, entry.ipAddress ?? null, entry.userAgent ?? null, Date.now());
}
export function listAudit(db, limit = 20) {
    return db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit);
}
