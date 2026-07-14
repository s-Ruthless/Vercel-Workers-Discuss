/**
 * 邮件通知模块
 * 使用 nodemailer 发送邮件（Vercel Node.js 环境）
 */
import nodemailer from 'nodemailer';
import { getSetting, getSettings, setSetting } from './db.js';
import { isValidEmail } from './utils.js';

export type EmailNotificationSettings = {
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
  };
};

const DEFAULT_REPLY_TEMPLATE = `<div style="background-color:#f4f4f5;padding:24px 0;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
    <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#2563eb,#4f46e5);">
      <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">评论回复 - \${postTitle}</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#e5e7eb;">你在文章下的评论收到了新的回复</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 8px 0;font-size:14px;color:#374151;">Hi <span style="font-weight:600;">\${toName}</span>，</p>
      <p style="margin:0 0 16px 0;font-size:14px;color:#4b5563;">
        <span style="font-weight:600;">\${replyAuthor}</span> 回复了你在
        <span style="font-weight:600;">《\${postTitle}》</span>中的评论：
      </p>
      <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f3f4f6;border:1px solid #e5e7eb;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">你之前的评论</div>
        <div style="font-size:14px;color:#374151;">\${parentComment}</div>
      </div>
      <div style="margin:0 0 24px 0;padding:14px 16px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;">
        <div style="font-size:12px;color:#1d4ed8;margin-bottom:6px;">最新回复</div>
        <div style="font-size:14px;color:#1f2937;">\${replyContent}</div>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="\${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">打开文章查看完整对话</a>
      </div>
    </div>
  </div>
</div>`;

const DEFAULT_ADMIN_TEMPLATE = `<div style="background-color:#f4f4f5;padding:24px 0;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111827;">
    <div style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#0f766e,#059669);">
      <h1 style="margin:0;font-size:18px;line-height:1.4;color:#f9fafb;">新评论提醒</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#d1fae5;">你的文章收到了新的评论</p>
    </div>
    <div style="padding:24px 28px;">
      <p style="margin:0 0 10px 0;font-size:14px;color:#374151;">
        <span style="font-weight:600;">\${commentAuthor}</span> 在文章
        <span style="font-weight:600;">《\${postTitle}》</span>下发表了新评论：
      </p>
      <div style="margin:0 0 18px 0;padding:14px 16px;border-radius:10px;background:#f9fafb;border:1px solid #e5e7eb;">
        <div style="font-size:14px;color:#374151;">\${commentContent}</div>
      </div>
      <div style="text-align:center;">
        <a href="\${postUrl}" style="display:inline-block;padding:10px 22px;border-radius:999px;background:#047857;color:#ffffff;font-size:14px;font-weight:500;text-decoration:none;">打开后台查看并管理评论</a>
      </div>
    </div>
  </div>
</div>`;

function replaceTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => variables[key] || '');
}

async function dispatchMail(
  payload: { to: string[]; subject: string; html: string },
  smtp?: EmailNotificationSettings['smtp']
): Promise<void> {
  if (!smtp || !smtp.user || !smtp.pass) {
    console.error('MailDispatch: SMTP not configured');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host || 'smtp.qq.com',
      port: smtp.port || 465,
      secure: smtp.secure ?? true,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transporter.sendMail({
      from: `"评论通知" <${smtp.user}>`,
      to: payload.to.join(', '),
      subject: payload.subject,
      html: payload.html,
    });

    console.log('MailDispatch:success', { to: payload.to });
  } catch (e: any) {
    console.error('MailDispatch:error', { message: e?.message || String(e) });
  }
}

export async function loadEmailNotificationSettings(): Promise<EmailNotificationSettings> {
  const keys = [
    'email_notify_enabled', 'email_smtp_host', 'email_smtp_port',
    'email_smtp_user', 'email_smtp_pass', 'email_smtp_secure',
    'email_template_reply', 'email_template_admin',
  ];
  const map = await getSettings(keys);

  const globalEnabled = map.get('email_notify_enabled') !== '0';
  const smtp = {
    host: map.get('email_smtp_host') || 'smtp.qq.com',
    port: parseInt(map.get('email_smtp_port') || '465', 10),
    user: map.get('email_smtp_user') || '',
    pass: map.get('email_smtp_pass') || '',
    secure: map.get('email_smtp_secure') !== '0',
  };
  const templates = {
    reply: map.get('email_template_reply') || DEFAULT_REPLY_TEMPLATE,
    admin: map.get('email_template_admin') || DEFAULT_ADMIN_TEMPLATE,
  };

  return { globalEnabled, smtp, templates };
}

export async function saveEmailNotificationSettings(settings: {
  globalEnabled?: boolean;
  smtp?: Partial<EmailNotificationSettings['smtp']>;
  templates?: Partial<NonNullable<EmailNotificationSettings['templates']>>;
}): Promise<void> {
  if (settings.globalEnabled !== undefined) {
    await setSetting('email_notify_enabled', settings.globalEnabled ? '1' : '0');
  }
  if (settings.smtp) {
    if (settings.smtp.host !== undefined) await setSetting('email_smtp_host', settings.smtp.host);
    if (settings.smtp.port !== undefined) await setSetting('email_smtp_port', String(settings.smtp.port));
    if (settings.smtp.user !== undefined) await setSetting('email_smtp_user', settings.smtp.user);
    if (settings.smtp.pass !== undefined) await setSetting('email_smtp_pass', settings.smtp.pass);
    if (settings.smtp.secure !== undefined) await setSetting('email_smtp_secure', settings.smtp.secure ? '1' : '0');
  }
  if (settings.templates) {
    if (settings.templates.reply !== undefined) await setSetting('email_template_reply', settings.templates.reply);
    if (settings.templates.admin !== undefined) await setSetting('email_template_admin', settings.templates.admin);
  }
}

export async function sendTestEmail(
  to: string,
  smtp: EmailNotificationSettings['smtp']
): Promise<{ success: boolean; message?: string }> {
  if (!smtp || !smtp.user || !smtp.pass) {
    return { success: false, message: 'SMTP 配置不完整' };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host, port: smtp.port, secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    await transporter.verify();
    await transporter.sendMail({
      from: `"Test" <${smtp.user}>`, to,
subject: 'VWD Comments 邮件配置测试',
    html: `<div style="padding:20px;font-family:sans-serif;"><h2 style="color:#059669;">配置成功！</h2><p>这是一封来自 VWD Comments 的测试邮件。</p></div>`,
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || String(e) };
  }
}

export async function sendCommentReplyNotification(
  params: {
    toEmail: string; toName: string; postTitle: string;
    parentComment: string; replyAuthor: string; replyContent: string; postUrl: string;
  },
  smtp?: EmailNotificationSettings['smtp'],
  template?: string
): Promise<void> {
  const { toEmail, toName, postTitle, parentComment, replyAuthor, replyContent, postUrl } = params;
  if (!isValidEmail(toEmail)) return;

  const html = replaceTemplate(template || DEFAULT_REPLY_TEMPLATE, {
    toEmail, toName, postTitle, parentComment, replyAuthor, replyContent, postUrl,
  });

  await dispatchMail({ to: [toEmail], subject: `评论回复 - ${postTitle}`, html }, smtp);
}

export async function sendCommentNotification(
  params: {
    postTitle: string; postUrl: string; commentAuthor: string; commentContent: string;
  },
  smtp?: EmailNotificationSettings['smtp'],
  template?: string
): Promise<void> {
  const { postTitle, postUrl, commentAuthor, commentContent } = params;
  const toEmail = await getAdminNotifyEmail();
  if (!isValidEmail(toEmail)) return;

  const html = replaceTemplate(template || DEFAULT_ADMIN_TEMPLATE, {
    postTitle, postUrl, commentAuthor, commentContent,
  });

  await dispatchMail({ to: [toEmail], subject: `新评论提醒 - ${postTitle}`, html }, smtp);
}

export async function getAdminNotifyEmail(): Promise<string> {
  const email = await getSetting('comment_admin_email') || await getSetting('admin_notify_email');
  if (email && isValidEmail(email)) return email.trim();
  throw new Error('未配置管理员通知邮箱或格式不正确');
}
