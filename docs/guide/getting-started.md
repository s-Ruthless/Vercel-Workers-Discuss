# 快速开始

## 项目简介

**VWD (Vercel Workers Discuss)** 是基于 Vercel Serverless 平台的自托管评论系统，使用 Vercel Postgres 和 Vercel KV 作为数据存储，深度适配 Vercel 生态，开箱即用。

本项目参考了 [CWD](https://github.com/anghunk/cwd)（Cloudflare Workers Discuss）和 [Waline](https://waline.js.org/) 评论系统的设计与实现。

## 功能特性

- **评论系统**：支持嵌套回复、Markdown 渲染、XSS 过滤、图片灯箱
- **说说功能**：博主可发布动态/短博文，支持 Markdown、表情、标签、点赞
- **管理后台**：Vue 3 + Vite 构建的独立 SPA，macOS 风格 UI，支持暗黑模式、中英文双语切换、自定义主题色
- **邮件通知**：SMTP 邮件通知，支持自定义模板，兼容 QQ/163 邮箱
- **Telegram 通知**：新评论实时推送到 Telegram，支持一键 Webhook 配置
- **S3 备份**：兼容 AWS S3 / Cloudflare R2 / MinIO，支持自动备份与恢复
- **点赞功能**：文章点赞、评论点赞和说说点赞
- **表情系统**：Waline 风格表情包，内置阿鲁表情包和颜文字
- **数据迁移**：支持从 Twikoo、Artalk、Valine 导入评论数据
- **多站点**：支持多站点管理，通过 site_id 隔离数据
- **安全**：IP/邮箱黑名单、域名白名单、评论审核机制

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 运行时 | Vercel Serverless (Node.js 20+) |
| Web 框架 | Hono + `hono/vercel` adapter |
| 数据库 | Vercel Postgres (Neon PostgreSQL) |
| 键值存储 | Vercel KV (Upstash Redis) |
| 邮件 | nodemailer |
| S3 存储 | aws4fetch |
| Admin 前端 | Vue 3 + Vite + TypeScript |
| 图表 | ECharts |
| 国际化 | vue-i18n |
| 样式 | LESS + CSS Variables（暗黑模式） |

## 前置要求

- GitHub 账号
- Vercel 账号（可使用 GitHub 登录）

## 一分钟部署

### 1. Fork 仓库

在 GitHub 上 Fork [Vercel-Workers-Discuss](https://github.com/s-Ruthless/Vercel-Workers-Discuss) 仓库。

### 2. 在 Vercel 导入

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 **Add New → Project**
3. 选择你 Fork 的仓库
4. Vercel 会自动识别 `vercel.json` 配置，点击 **Deploy**

### 3. 创建数据库

在 Vercel 控制台创建以下资源并连接到项目：

1. **Vercel Postgres** — 存储评论、设置、说说数据
2. **Vercel KV** — 管理会话 Token 和限流

### 4. 重新部署

关联数据库后点击 **Redeploy**，数据库表会在首次请求时自动创建。

### 5. 设置管理员

打开 `https://your-project.vercel.app/admin/`，首次访问会引导你设置管理员账号和密码。

## 部署完成

| 地址 | 说明 |
| --- | --- |
| `https://your-project.vercel.app/` | 首页引导页 |
| `https://your-project.vercel.app/doc/` | 文文档站（本站） |
| `https://your-project.vercel.app/admin/` | 管理后台 |
| `https://your-project.vercel.app/vwd.js` | Widget JS 文件 |
| `https://your-project.vercel.app/api/health` | 健康检查 |

详细的部署说明见 [部署到 Vercel](./deploy)。
