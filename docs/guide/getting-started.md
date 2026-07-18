# Vercel Workers Discuss

**VWD 评论系统** 是基于 Vercel Serverless 平台的免服务器、极速安全、即插即用评论系统。

数据存储在 Vercel Postgres（Neon PostgreSQL）中，会话与限流使用 Vercel KV（Upstash Redis）。深度适配 Vercel 生态，根据对 Vercel 免费计划的分析，VWD 评论系统的部署成本为零，不需要任何成本。

**指标分析：** 你可以根据你的站点日常承接能力，确认选择使用该评论系统。

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
- 🌐 **多站点**：支持多站点管理，通过 `siteId` 隔离数据

## 前置要求

- GitHub 账号
- Vercel 账号（可使用 GitHub 登录）

## 安装

```bash
# 克隆项目
git clone https://github.com/s-Ruthless/Vercel-Workers-Discuss.git
cd Vercel-Workers-Discuss
# 部署请查看文档
npm install
```

## 配置

- [后端配置](./backend-config)
- [前端配置](./frontend-config)
