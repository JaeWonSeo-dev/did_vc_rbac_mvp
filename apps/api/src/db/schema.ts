export const schemaSql = `
CREATE TABLE IF NOT EXISTS credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jti TEXT UNIQUE NOT NULL,
  subject_did TEXT NOT NULL,
  issuer_did TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  vc_jwt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  status_reason TEXT,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_identities (
  did TEXT PRIMARY KEY,
  encrypted_private_jwk TEXT NOT NULL,
  public_jwk_json TEXT NOT NULL,
  passphrase_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  holder_did TEXT NOT NULL,
  credential_jti TEXT NOT NULL,
  vc_jwt_encrypted TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  issuer_did TEXT NOT NULL,
  added_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_requests (
  state TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  client_id TEXT NOT NULL,
  response_uri TEXT NOT NULL,
  target_path TEXT NOT NULL,
  required_role TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS replay_cache (
  token_jti TEXT PRIMARY KEY,
  token_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  holder_did TEXT NOT NULL,
  role TEXT NOT NULL,
  permissions_json TEXT NOT NULL,
  csrf_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  outcome TEXT NOT NULL,
  summary_reason TEXT NOT NULL,
  detail_reason TEXT NOT NULL,
  holder_did TEXT,
  credential_jti TEXT,
  session_id TEXT,
  target_path TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS keystore (
  alias TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  public_jwk_json TEXT NOT NULL,
  private_jwk_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;
