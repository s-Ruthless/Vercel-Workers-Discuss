# 快速开始

**VWD 评论系统** 是基于 Vercel Serverless 平台的免服务器、极速安全、即插即用评论系统。

数据存储在 Vercel Postgres（Neon PostgreSQL）中，会话与限流使用 Vercel KV（Upstash Redis）。深度适配 Vercel 生态，部署成本为零，开箱即用。

**指标分析：** 你可以根据你的站点日常承接能力，确认选择使用该评论系统。Vercel Hobby（免费）计划额度如下：

| 指标 | 免费每月额度 | 单次消耗 | 理论极限 |
| --- | --- | --- | --- |
| Serverless 函数调用 | 100 万次 | ~3 次/次访问 | 33 万次页面访问 |
| 带宽 | 100 GB | ~50 KB/次访问 | 200 万次页面访问 |
| Postgres 计算 | 60 小时 | ~20ms/次请求 | 1000 万次请求 |
| KV 命令 | 300 万次 | ~2 次/次访问 | 150 万次页面访问 |

因此请放心：

对于个人博客或中小型站点来说，免费计划完全够用。

## 特性

- ⚡️ **极速响应**：基于 Vercel 边缘网络与全球 CDN
- 💬 **完善评论**：嵌套回复、Markdown 渲染、XSS 过滤、图片灯箱
- 🎨 **易于集成**：一行代码嵌入，提供完整 REST API 与 Widget
- 🔧 **管理后台**：Vue 3 + macOS 风格 UI，暗黑模式、中英文双语、自定义主题色
- 📝 **说说功能**：博主可发布动态/短博文，支持 Markdown、表情、标签、点赞
- 🔄 **评论审核**：支持手动审核评论，防止垃圾评论
- 🔒 **安全防护**：IP/邮箱黑名单、域名白名单、管理员鉴权、CORS 保护
- 📧 **邮件通知**：SMTP 邮件通知，支持自定义模板，兼容 QQ/163 邮箱
- 🤖 **Telegram 通知**：新评论实时推送到 Telegram，一键 Webhook 配置
- 💾 **S3 备份**：兼容 AWS S3 / Cloudflare R2 / MinIO，自动备份与恢复
- 👍 **点赞功能**：文章点赞、评论点赞和说说点赞
- 😊 **表情系统**：Waline 风格表情包，内置阿鲁表情包和颜文字
- 🔄 **数据迁移**：支持从 Twikoo、Artalk、Valine 导入评论数据
- 🌐 **多站点**：支持多站点管理，通过 `site_id` 隔离数据

## 前置要求

- GitHub 账号
- Vercel 账号（可使用 GitHub 登录）

## 安装

### 1. Fork / 克隆仓库

```bash
git clone https://github.com/s-Ruthless/Vercel-Workers-Discuss.git
cd Vercel-Workers-Discuss
```

或直接在 GitHub 上 Fork [Vercel-Workers-Discuss](https://github.com/s-Ruthless/Vercel-Workers-Discuss) 仓库。

### 2. 在 Vercel 导入

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 **Add New → Project**
3. 选择你 Fork 的仓库 `Vercel-Workers-Discuss`
4. Vercel 会自动识别 `vercel.json` 配置，点击 **Deploy**

### 3. 创建数据库资源

在 Vercel 控制台创建以下资源并连接到项目：

1. **Vercel Postgres** — 存储评论、设置、说说数据
2. **Vercel KV** — 管理会话 Token 和限流

> 以下环境变量会自动注入，无需手动配置：`POSTGRES_URL`、`KV_REST_API_URL`、`KV_REST_API_TOKEN`

### 4. 重新部署并设置管理员

关联数据库后点击 **Redeploy**，数据库表会在首次请求时自动创建。

部署成功后，打开 `https://your-project.vercel.app/admin/`，首次访问会引导你设置管理员账号和密码。

## 部署完成

| 地址 | 说明 |
| --- | --- |
| `https://your-project.vercel.app/` | 首页引导页 |
| `https://your-project.vercel.app/doc/` | 使用文档（本站） |
| `https://your-project.vercel.app/admin/` | 管理后台 |
| `https://your-project.vercel.app/vwd.js` | Widget JS 文件 |
| `https://your-project.vercel.app/api/health` | 健康检查 |

## 配置

- [部署到 Vercel（详细）](./deploy)
- [Hexo 博客接入](./hexo-integration)
- [Widget 配置项](./widget-config)
- [说说功能](./says)
