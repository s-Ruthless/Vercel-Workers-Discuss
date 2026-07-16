/**
 * 评论设置管理
 */
import { getSettings, setSetting, deleteSetting } from './db.js';
import { isValidEmail } from './utils.js';

const KEYS = {
  adminEmail: 'comment_admin_email',
  adminBadge: 'comment_admin_badge',
  avatarPrefix: 'comment_avatar_prefix',
  adminEnabled: 'comment_admin_enabled',
  allowedDomains: 'comment_allowed_domains',
  adminKeyHash: 'comment_admin_key_hash',
  requireReview: 'comment_require_review',
  blockedIps: 'comment_blocked_ips',
  blockedEmails: 'comment_blocked_emails',
  adminDisplayConfig: 'admin_display_config',
} as const;

export type CommentSettings = {
  adminEmail: string | null;
  adminBadge: string | null;
  avatarPrefix: string | null;
  adminEnabled: boolean;
  allowedDomains: string[];
  requireReview: boolean;
  blockedIps: string[];
  blockedEmails: string[];
  adminKey: string | null;
  adminKeySet: boolean;
};

export async function loadCommentSettings(): Promise<CommentSettings> {
  const map = await getSettings(Object.values(KEYS));

  const blockedIpsRaw = map.get(KEYS.blockedIps) || '';
  const blockedIps = blockedIpsRaw ? blockedIpsRaw.split(',').map(d => d.trim()).filter(Boolean) : [];

  const blockedEmailsRaw = map.get(KEYS.blockedEmails) || '';
  const blockedEmails = blockedEmailsRaw ? blockedEmailsRaw.split(',').map(d => d.trim()).filter(Boolean) : [];

  const allowedDomainsRaw = map.get(KEYS.allowedDomains) || '';
  const allowedDomains = allowedDomainsRaw ? allowedDomainsRaw.split(',').map(d => d.trim()).filter(Boolean) : [];

  return {
    adminEmail: map.get(KEYS.adminEmail) || null,
    adminBadge: map.get(KEYS.adminBadge) || null,
    avatarPrefix: map.get(KEYS.avatarPrefix) || null,
    adminEnabled: map.get(KEYS.adminEnabled) === '1',
    allowedDomains,
    requireReview: map.get(KEYS.requireReview) === '1',
    blockedIps,
    blockedEmails,
    adminKey: map.get(KEYS.adminKeyHash) || null,
    adminKeySet: !!map.get(KEYS.adminKeyHash),
  };
}

export async function saveCommentSettings(settings: {
  adminEmail?: string;
  adminBadge?: string;
  avatarPrefix?: string;
  adminEnabled?: boolean;
  allowedDomains?: string[];
  adminKey?: string;
  requireReview?: boolean;
  blockedIps?: string[];
  blockedEmails?: string[];
}): Promise<void> {
  const entries: { key: string; value: string | null | undefined }[] = [
    { key: KEYS.adminEmail, value: settings.adminEmail },
    { key: KEYS.adminBadge, value: settings.adminBadge },
    { key: KEYS.avatarPrefix, value: settings.avatarPrefix },
    { key: KEYS.adminEnabled, value: typeof settings.adminEnabled === 'boolean' ? (settings.adminEnabled ? '1' : '0') : undefined },
    { key: KEYS.allowedDomains, value: settings.allowedDomains ? settings.allowedDomains.join(',') : undefined },
    { key: KEYS.adminKeyHash, value: settings.adminKey },
    { key: KEYS.requireReview, value: typeof settings.requireReview === 'boolean' ? (settings.requireReview ? '1' : '0') : undefined },
    { key: KEYS.blockedIps, value: settings.blockedIps ? settings.blockedIps.join(',') : undefined },
    { key: KEYS.blockedEmails, value: settings.blockedEmails ? settings.blockedEmails.join(',') : undefined },
  ];

  for (const entry of entries) {
    if (entry.value !== undefined) {
      const trimmed = typeof entry.value === 'string' ? entry.value.trim() : entry.value;
      if (trimmed) {
        await setSetting(entry.key, trimmed);
      } else {
        await deleteSetting(entry.key);
      }
    }
  }
}

export async function loadAdminDisplaySettings(): Promise<{ layoutTitle: string }> {
  const { getSetting } = await import('./db.js');
  const raw = await getSetting(KEYS.adminDisplayConfig);
  if (!raw) return { layoutTitle: 'VWD 评论系统' };
  try {
    const parsed = JSON.parse(raw);
    return { layoutTitle: parsed.layoutTitle || 'VWD 评论系统' };
  } catch {
    return { layoutTitle: 'VWD 评论系统' };
  }
}

export async function saveAdminDisplaySettings(settings: { layoutTitle?: string }): Promise<void> {
  const current = await loadAdminDisplaySettings();
  const next = { layoutTitle: settings.layoutTitle !== undefined ? settings.layoutTitle : current.layoutTitle };
  await setSetting(KEYS.adminDisplayConfig, JSON.stringify(next));
}

export async function addToBlockedList(type: 'ip' | 'email', value: string): Promise<void> {
  const key = type === 'ip' ? KEYS.blockedIps : KEYS.blockedEmails;
  const { getSetting } = await import('./db.js');
  const existing = await getSetting(key) || '';
  const list = existing ? existing.split(',').map(d => d.trim()).filter(Boolean) : [];
  if (!list.includes(value)) {
    list.push(value);
    await setSetting(key, list.join(','));
  }
}

export { isValidEmail };
