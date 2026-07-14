<div align="center">

# VWD (Vercel Workers Discuss)

![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/Vercel-Postgres-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![KV](https://img.shields.io/badge/Vercel-KV-FF0000?logo=redis&logoColor=white&style=flat-square)
![Hono](https://img.shields.io/badge/Hono-Web%20Framework-E36002?logo=hono&logoColor=white&style=flat-square)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white&style=flat-square)
![Node.js](https://img.shields.io/badge/node-%3E=20.0.0-339933?logo=node.js&logoColor=white&style=flat-square)
![License](https://img.shields.io/badge/License-Apache--2.0-blue?style=flat-square)

基于 Vercel Serverless 平台的自托管评论系统，使用 Vercel Postgres 和 Vercel KV 作为数据存储。

完全脱离 Cloudflare，深度适配 Vercel 生态，开箱即用。

</div>

## 功能特性

- **评论系统**：支持嵌套回复、Markdown 渲染、XSS 过滤、图片灯箱
- **管理后台**：Vue 3 + Vite 构建的独立 SPA，支持暗黑模式和多语言
- **邮件通知**：SMTP 邮件通知，支持自定义模板，兼容 QQ/163 邮箱
- **Telegram 通知**：新评论实时推送到 Telegram，支持一键 Webhook 配置
- **S3 备份**：兼容 AWS S3 / Cloudflare R2 / MinIO，支持自动备份与恢复
- **访问统计**：PV 统计、页面访问明细、每日趋势图表
- **点赞功能**：文章点赞和评论点赞
- **表情系统**：内置阿鲁表情包和 Twemoji，支持自定义表情包
- **数据迁移**：支持从 Twikoo、Artalk、Valine 导入评论数据
- **多站点**：支持多站点管理，通过 site_id 隔离数据
- **安全**：IP/邮箱黑名单、域名白名单、评论审核机制

## 项目结构

```
cwd-vercel/
├── api/                  # Vercel Serverless Functions（Hono 框架）
│   ├── [[...route]].ts   #   路由入口（Catch-all 路由）
│   ├── admin.ts          #   管理后台 API 逻辑
│   └── public.ts         #   公开 API（评论、点赞、统计）
├── lib/                  # 工具层
│   ├── auth.ts           #   管理员鉴权中间件（基于 Vercel KV）
│   ├── db.ts             #   Vercel Postgres 数据库访问层
│   ├── kv.ts             #   Vercel KV 封装
│   ├── email.ts          #   邮件发送（nodemailer）
│   ├── s3.ts             #   S3 兼容存储客户端（aws4fetch）
│   ├── commentSettings.ts#   评论设置读写
│   ├── featureSettings.ts#   功能开关设置
│   ├── emotion.ts        #   表情资源处理
│   └── utils.ts          #   通用工具（IP 获取、UA 解析等）
├── admin/                # 管理后台前端（Vue 3 + Vite + TypeScript）
│   ├── src/
│   │   ├── api/          #   API 请求封装
│   │   ├── components/   #   通用组件
│   │   ├── composables/  #   组合式函数
│   │   ├── locales/      #   多语言（zh-CN / en-US）
│   │   ├── router/       #   路由配置
│   │   ├── styles/       #   样式（LESS + 暗黑模式）
│   │   └── views/        #   页面组件
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── public/               # 静态资源（构建时自动生成）
│   ├── admin/            #   Admin SPA 构建产物（.gitignore）
│   └── emotion/          #   表情图片资源
├── sql/
│   └── schema.sql        #   PostgreSQL 数据表定义
├── scripts/
│   ├── copy-assets.cjs   #   构建脚本：复制表情资源 + 生成 OwO.json
│   └── init-db.cjs       #   数据库初始化脚本
├── vercel.json           #   Vercel 配置（路由、CORS、函数超时）
├── package.json
└── tsconfig.json
```

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
| 多语言 | vue-i18n |
| 样式 | LESS + CSS Variables（暗黑模式） |

## 快速部署

### 前置要求

- Node.js 20+
- Vercel 账号
- Vercel CLI（`npm install -g vercel`）

### 1. 克隆并安装

```bash
git clone <your-repo-url>
cd cwd-vercel
npm install
```

### 2. 创建 Vercel 资源

在 Vercel 控制台中创建：

1. **Vercel Postgres** — 用于存储评论、设置、统计数据
2. **Vercel KV** — 用于管理会话 Token 和限流

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| `ADMIN_NAME` | 管理后台登录用户名 | `admin` |
| `ADMIN_PASSWORD` | 管理后台登录密码 | `your-password` |
| `POSTGRES_URL` | Vercel Postgres 连接地址（自动注入） | Vercel 自动填充 |
| `KV_REST_API_URL` | Vercel KV REST API 地址（自动注入） | Vercel 自动填充 |
| `KV_REST_API_TOKEN` | Vercel KV REST API Token（自动注入） | Vercel 自动填充 |

### 4. 初始化数据库

```bash
# 确保已设置 POSTGRES_URL 环境变量
npm run db:init
```

此命令会执行 `sql/schema.sql`，创建评论表、设置表、统计表和点赞表。

### 5. 构建并部署

```bash
# 构建 Admin 前端 + 复制表情资源
npm run build

# 部署到 Vercel
npm run deploy
```

或者直接在 Vercel 控制台关联 Git 仓库，推送代码后自动构建部署。

### 部署成功后

- API 根路径：`https://your-project.vercel.app/`
- 管理后台：`https://your-project.vercel.app/admin/`
- 表情资源：`https://your-project.vercel.app/emotion/`
- 健康检查：`https://your-project.vercel.app/api/health`

## 接入评论组件

### 方式一：使用 CWD Widget（推荐）

VWD 的 API 路径与 CWD (Cloudflare Workers Discuss) 完全兼容，可直接使用现有的 CWD Widget：

```html
<!-- 引入评论组件 -->
<script src="https://your-cdn.com/cwd.js"></script>
<div id="cwd-comments"></div>
<script>
  new CWDComments({
    apiBaseUrl: 'https://your-project.vercel.app',
    el: '#cwd-comments'
  });
</script>
```

### 方式二：直接调用 API

```html
<!-- 获取评论列表 -->
<script>
  fetch('https://your-project.vercel.app/api/comments?postSlug=/your-page&siteId=')
    .then(res => res.json())
    .then(data => console.log(data));
</script>
```

## API 概览

### 公开 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/comments` | 获取评论列表 |
| POST | `/api/comments` | 提交评论 |
| POST | `/api/comments/like` | 评论点赞 |
| POST | `/api/verify-admin` | 管理员评论验证 |
| GET | `/api/like` | 获取文章点赞状态 |
| POST | `/api/like` | 文章点赞 |
| POST | `/api/analytics/visit` | 上报访问记录 |
| GET | `/api/analytics/pv` | 获取页面 PV |
| GET | `/api/emotions` | 获取表情列表 |
| GET | `/api/config/comments` | 获取公开配置 |
| GET | `/api/health` | 健康检查 |

### 管理 API（需鉴权）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/admin/login` | 管理员登录 |
| GET | `/api/admin/comments/list` | 评论列表 |
| DELETE | `/api/admin/comments/delete` | 删除评论 |
| PUT | `/api/admin/comments/status` | 更新评论状态 |
| PUT | `/api/admin/comments/update` | 编辑评论 |
| GET/PUT | `/api/admin/settings/*` | 各项设置 |
| GET/POST | `/api/admin/export/*` | 数据导出 |
| POST | `/api/admin/import/*` | 数据导入 |
| GET | `/api/admin/stats/*` | 统计数据 |
| GET | `/api/admin/analytics/*` | 访问分析 |

> 所有管理 API（除 login 外）需在请求头中携带 `Authorization: Bearer <token>`。

## 数据库表结构

| 表名 | 说明 |
| --- | --- |
| `Comment` | 评论数据（昵称、邮箱、内容、状态、点赞数等） |
| `Settings` | 系统设置（键值对存储） |
| `page_stats` | 页面访问统计（PV、最后访问时间） |
| `page_visit_daily` | 每日访问趋势 |
| `Likes` | 点赞记录（文章点赞，按 user_id 去重） |

完整定义见 [sql/schema.sql](./sql/schema.sql)。

## 环境变量说明

| 变量 | 必需 | 说明 |
| --- | --- | --- |
| `ADMIN_NAME` | 是 | 管理后台登录用户名 |
| `ADMIN_PASSWORD` | 是 | 管理后台登录密码 |
| `POSTGRES_URL` | 是 | Vercel Postgres 连接地址（Vercel 自动注入） |
| `KV_REST_API_URL` | 是 | Vercel KV REST API 地址（Vercel 自动注入） |
| `KV_REST_API_TOKEN` | 是 | Vercel KV REST API Token（Vercel 自动注入） |

以下配置在 Admin 后台的设置页面中配置，存储在数据库中：

- **SMTP 配置**：发件邮箱、SMTP 服务器、端口、授权码
- **Telegram 配置**：Bot Token、Chat ID
- **S3 配置**：Endpoint、Region、Bucket、Access Key、Secret Key

## 本地开发

```bash
# 安装依赖
npm install
cd admin && npm install && cd ..

# 启动 Vercel Dev（包含 API + Admin 热更新）
npm run dev

# 单独开发 Admin 前端
cd admin
npm run dev
```

## 构建脚本

```bash
# 完整构建（Admin 前端 + 表情资源）
npm run build

# 仅构建 Admin 前端
npm run build:admin

# 仅复制表情资源
npm run build:assets

# 初始化数据库
npm run db:init

# 部署到 Vercel
npm run deploy
```

## License

[Apache-2.0](./LICENSE)
