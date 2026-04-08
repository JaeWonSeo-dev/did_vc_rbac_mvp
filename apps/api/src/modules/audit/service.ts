export function writeAudit(db: any, entry: {
  eventType: string;
  outcome: string;
  summaryReason: string;
  detailReason: string;
  holderDid?: string | null;
  credentialJti?: string | null;
  sessionId?: string | null;
  targetPath?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  db.prepare(`INSERT INTO audit_logs(event_type, outcome, summary_reason, detail_reason, holder_did, credential_jti, session_id, target_path, ip_address, user_agent, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      entry.eventType,
      entry.outcome,
      entry.summaryReason,
      entry.detailReason,
      entry.holderDid ?? null,
      entry.credentialJti ?? null,
      entry.sessionId ?? null,
      entry.targetPath ?? null,
      entry.ipAddress ?? null,
      entry.userAgent ?? null,
      Date.now()
    );
}

export function listAudit(db: any, limit = 20) {
  return db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").all(limit);
}
