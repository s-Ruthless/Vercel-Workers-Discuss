import { get, post, put, del, getApiBaseUrl } from './http';

export type AdminLoginResponse = {
  data: {
    key: string;
  };
};

export type CommentItem = {
  id: number;
  created: number;
  name: string;
  email: string;
  avatar: string;
  postSlug: string;
  postUrl: string | null;
  url: string | null;
  ipAddress: string | null;
  contentText: string;
  contentHtml: string;
  status: string;
  priority?: number;
  likes?: number;
  ua?: string | null;
  isAdmin?: boolean;
  siteId?: string;
};

export type CommentListResponse = {
  data: CommentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

export type CommentSettingsResponse = {
  adminEmail: string | null;
  adminBadge: string | null;
  avatarPrefix: string | null;
  adminEnabled: boolean;
  allowedDomains?: string[];
  adminKey?: string | null;
  adminKeySet?: boolean;
  requireReview?: boolean;
  blockedIps?: string[];
  blockedEmails?: string[];
};

export type EmailNotifySettingsResponse = {
  globalEnabled: boolean;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
  templates?: {
    reply?: string;
    admin?: string;
    approved?: string;
  };
};

export type CommentStatsResponse = {
  summary: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  domains: {
    domain: string;
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  }[];
  last7Days: {
    date: string;
    total: number;
  }[];
};

export type VisitOverviewResponse = {
  totalPv: number;
  totalPages: number;
  todayPv: number;
  yesterdayPv?: number;
  weekPv: number;
  lastWeekPv?: number;
  monthPv: number;
  lastMonthPv?: number;
  last30Days?: {
    date: string;
    total: number;
  }[];
};

export type VisitPageItem = {
  postSlug: string;
  postTitle: string | null;
  postUrl: string | null;
  pv: number;
  lastVisitAt: number | null;
};

export type VisitPagesResponse = {
  items: VisitPageItem[];
  itemsByPv?: VisitPageItem[];
  itemsByLatest?: VisitPageItem[];
};

export type SiteListResponse = {
  sites: string[];
};

export type LikeStatsItem = {
  pageSlug: string;
  pageTitle: string | null;
  pageUrl: string | null;
  likes: number;
};

export type LikeStatsResponse = {
  items: LikeStatsItem[];
};

export type FeatureSettingsResponse = {
  enableCommentLike: boolean;
  enableArticleLike: boolean;
  enableImageLightbox: boolean;
  enableEmoji: boolean;
  commentPlaceholder?: string;
};

export type AdminDisplaySettingsResponse = {
  layoutTitle: string | null;
};

export type TelegramSettingsResponse = {
  botToken: string | null;
  chatId: string | null;
  notifyEnabled: boolean;
};

export type S3SettingsResponse = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
};

export type S3BackupItem = {
  key: string;
  size: number;
  lastModified: string;
};

/* --- Auth --- */

export type SetupStatusResponse = {
  setupCompleted: boolean;
};

export type SetupResponse = {
  data: {
    key: string;
    message: string;
  };
};

export async function checkSetupStatus(): Promise<SetupStatusResponse> {
  return await get<SetupStatusResponse>('/api/admin/setup-status');
}

export async function setupAdmin(name: string, password: string): Promise<string> {
  const res = await post<SetupResponse>('/api/admin/setup', { name, password });
  const key = res.data.key;
  localStorage.setItem('vwd_admin_token', key);
  return key;
}

export async function loginAdmin(name: string, password: string): Promise<string> {
  const res = await post<AdminLoginResponse>('/api/admin/login', { name, password });
  const key = res.data.key;
  localStorage.setItem('vwd_admin_token', key);
  return key;
}

export function logoutAdmin(): void {
  localStorage.removeItem('vwd_admin_token');
}

/* --- Comments --- */

export function fetchComments(page: number, siteId?: string): Promise<CommentListResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  if (siteId && siteId !== 'default') {
    params.set('siteId', siteId);
  }
  return get<CommentListResponse>(`/api/admin/comments/list?${params.toString()}`);
}

export function deleteComment(id: number): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/admin/comments/delete?id=${id}`);
}

export function updateCommentStatus(id: number, status: string): Promise<{ message: string }> {
  return put<{ message: string }>(`/api/admin/comments/status?id=${id}&status=${encodeURIComponent(status)}`);
}

export function updateComment(data: {
  id: number;
  name: string;
  email: string;
  url?: string | null;
  postUrl?: string | null;
  postSlug?: string;
  contentText: string;
  status?: string;
  priority?: number;
}): Promise<{ message: string }> {
  return put<{ message: string }>('/api/admin/comments/update', {
    id: data.id,
    name: data.name,
    email: data.email,
    url: data.url ?? null,
    postUrl: data.postUrl ?? null,
    postSlug: data.postSlug,
    content: data.contentText,
    status: data.status,
    priority: data.priority,
  });
}

export function blockIp(ip: string): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/comments/block-ip', { ip });
}

export function blockEmail(email: string): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/comments/block-email', { email });
}

/* --- Settings: Comments --- */

export function fetchCommentSettings(): Promise<CommentSettingsResponse> {
  return get<CommentSettingsResponse>('/api/admin/settings/comments');
}

export function saveCommentSettings(data: {
  adminEmail?: string;
  adminBadge?: string;
  avatarPrefix?: string;
  adminEnabled?: boolean;
  allowedDomains?: string[];
  adminKey?: string;
  requireReview?: boolean;
  blockedIps?: string[];
  blockedEmails?: string[];
}): Promise<{ message: string }> {
  return put<{ message: string }>('/api/admin/settings/comments', data);
}

/* --- Settings: Email Notify --- */

export function fetchEmailNotifySettings(): Promise<EmailNotifySettingsResponse> {
  return get<EmailNotifySettingsResponse>('/api/admin/settings/email-notify');
}

export function saveEmailNotifySettings(data: {
  globalEnabled?: boolean;
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
  };
  templates?: {
    reply?: string;
    admin?: string;
    approved?: string;
  };
}): Promise<{ message: string }> {
  return put<{ message: string }>('/api/admin/settings/email-notify', data);
}

export function sendTestEmail(data: {
  toEmail: string;
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
  };
}): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/settings/email-test', data);
}

/* --- Settings: Features --- */

export function fetchFeatureSettings(): Promise<FeatureSettingsResponse> {
  return get<FeatureSettingsResponse>('/api/admin/settings/features');
}

export function saveFeatureSettings(data: {
  enableCommentLike?: boolean;
  enableArticleLike?: boolean;
  enableImageLightbox?: boolean;
  enableEmoji?: boolean;
  commentPlaceholder?: string;
}): Promise<{ message: string }> {
  return put<{ message: string }>('/api/admin/settings/features', data);
}

/* --- Settings: Admin Display --- */

export function fetchAdminDisplaySettings(): Promise<AdminDisplaySettingsResponse> {
  return get<AdminDisplaySettingsResponse>('/api/admin/settings/admin-display');
}

export function saveAdminDisplaySettings(data: {
  layoutTitle?: string;
}): Promise<{ message: string }> {
  return put<{ message: string }>('/api/admin/settings/admin-display', data);
}

/* --- Settings: Telegram --- */

export function fetchTelegramSettings(): Promise<TelegramSettingsResponse> {
  return get<TelegramSettingsResponse>('/api/admin/settings/telegram');
}

export function saveTelegramSettings(data: {
  botToken?: string;
  chatId?: string;
  notifyEnabled?: boolean;
}): Promise<{ message: string }> {
  return put<{ message: string }>('/api/admin/settings/telegram', data);
}

export function setupTelegramWebhook(): Promise<{ message: string; webhookUrl: string }> {
  return post<{ message: string; webhookUrl: string }>('/api/admin/settings/telegram/setup', {});
}

export function sendTelegramTestMessage(): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/settings/telegram/test', {});
}

/* --- Stats --- */

export function fetchCommentStats(siteId?: string): Promise<CommentStatsResponse> {
  const params = new URLSearchParams();
  if (siteId && siteId !== 'default') {
    params.set('siteId', siteId);
  }
  const query = params.toString();
  return get<CommentStatsResponse>(query ? `/api/admin/stats/comments?${query}` : '/api/admin/stats/comments');
}

export function fetchSiteList(): Promise<SiteListResponse> {
  return get<SiteListResponse>('/api/admin/stats/sites');
}

/* --- Analytics --- */

export function fetchVisitOverview(siteId?: string): Promise<VisitOverviewResponse> {
  const params = new URLSearchParams();
  if (siteId && siteId !== 'default') {
    params.set('siteId', siteId);
  }
  const query = params.toString();
  return get<VisitOverviewResponse>(query ? `/api/admin/analytics/overview?${query}` : '/api/admin/analytics/overview');
}

export function fetchVisitPages(siteId?: string, order?: 'pv' | 'latest'): Promise<VisitPagesResponse> {
  const params = new URLSearchParams();
  if (siteId && siteId !== 'default') {
    params.set('siteId', siteId);
  }
  if (order) {
    params.set('order', order);
  }
  const query = params.toString();
  return get<VisitPagesResponse>(query ? `/api/admin/analytics/pages?${query}` : '/api/admin/analytics/pages');
}

export function fetchLikeStats(siteId?: string): Promise<LikeStatsResponse> {
  const params = new URLSearchParams();
  if (siteId && siteId !== 'default') {
    params.set('siteId', siteId);
  }
  const query = params.toString();
  return get<LikeStatsResponse>(query ? `/api/admin/likes/stats?${query}` : '/api/admin/likes/stats');
}

/* --- Data: Export / Import --- */

export function exportComments(): Promise<any[]> {
  return get<any[]>('/api/admin/comments/export');
}

export function importComments(data: any[]): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/comments/import', data);
}

export function exportConfig(): Promise<any[]> {
  return get<any[]>('/api/admin/export/config');
}

export function importConfig(data: any[]): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/import/config', data);
}

export function exportStats(siteId?: string): Promise<any> {
  const params = new URLSearchParams();
  if (siteId && siteId !== 'default') {
    params.set('siteId', siteId);
  }
  const query = params.toString();
  return get<any>(query ? `/api/admin/export/stats?${query}` : '/api/admin/export/stats');
}

export function importStats(data: any): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/import/stats', data);
}

export function exportBackup(): Promise<any> {
  return get<any>('/api/admin/export/backup');
}

export function importBackup(data: any): Promise<{ message: string }> {
  return post<{ message: string }>('/api/admin/import/backup', data);
}

/* --- S3 Backup --- */

export function fetchS3Settings(): Promise<S3SettingsResponse> {
  return get<S3SettingsResponse>('/api/admin/settings/s3');
}

export function saveS3Settings(data: S3SettingsResponse): Promise<{ message: string }> {
  return put<{ message: string }>('/api/admin/settings/s3', data);
}

export function triggerS3Backup(): Promise<{ message: string; file: string }> {
  return post<{ message: string; file: string }>('/api/admin/backup/s3', {});
}

export function fetchS3BackupList(): Promise<{ files: S3BackupItem[] }> {
  return get<{ files: S3BackupItem[] }>('/api/admin/backup/s3/list');
}

export function deleteS3Backup(key: string): Promise<{ message: string }> {
  return del<{ message: string }>(`/api/admin/backup/s3?key=${encodeURIComponent(key)}`);
}

export function downloadS3BackupUrl(key: string): string {
  const apiBaseUrl = getApiBaseUrl();
  return `${apiBaseUrl}/api/admin/backup/s3/download?key=${encodeURIComponent(key)}`;
}
