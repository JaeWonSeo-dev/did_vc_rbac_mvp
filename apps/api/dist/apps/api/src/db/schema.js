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

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  did TEXT UNIQUE NOT NULL,
  display_name TEXT,
  headline TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  portfolio_slug TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS github_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  github_user_id TEXT,
  username TEXT,
  profile_url TEXT,
  access_token TEXT,
  scope TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  linked_at INTEGER,
  updated_at INTEGER NOT NULL,
  profile_json TEXT NOT NULL DEFAULT '{}',
  contribution_summary_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS github_repositories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  github_repo_id TEXT,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT NOT NULL,
  homepage_url TEXT,
  language TEXT,
  stargazers_count INTEGER NOT NULL DEFAULT 0,
  forks_count INTEGER NOT NULL DEFAULT 0,
  watchers_count INTEGER NOT NULL DEFAULT 0,
  open_issues_count INTEGER NOT NULL DEFAULT 0,
  default_branch TEXT,
  pushed_at TEXT,
  updated_at TEXT,
  contribution_role TEXT,
  estimated_contribution_count INTEGER NOT NULL DEFAULT 0,
  estimated_merged_pr_count INTEGER NOT NULL DEFAULT 0,
  summary_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS portfolio_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  live_url TEXT,
  highlights_json TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS portfolio_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credential_jti TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  vc_jwt TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS github_oauth_states (
  state TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credential_jti TEXT NOT NULL,
  portfolio_slug TEXT,
  verifier TEXT,
  result TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`;
