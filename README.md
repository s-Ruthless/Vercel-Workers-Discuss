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

深度适配 Vercel 生态，开箱即用。

本项目参考了 [CWD](https://github.com/anghunk/cwd)(Cloudflare Workers Discuss) 和 [Waline](https://waline.js.org/) 评论系统的设计与实现。

</div>

## 功能特性

- **评论系统**：支持嵌套回复、Markdown 渲染、XSS 过滤、图片灯箱
- **说说功能**：博主可发布动态/短博文，支持 Markdown、表情、标签、点赞
- **管理后台**：Vue 3 + Vite 构建的独立 SPA，macOS 风格 UI，支持暗黑模式
- **邮件通知**：SMTP 邮件通知，支持自定义模板，兼容 QQ/163 邮箱
- **Telegram 通知**：新评论实时推送到 Telegram，支持一键 Webhook 配置
- **S3 备份**：兼容 AWS S3 / Cloudflare R2 / MinIO，支持自动备份与恢复
- **点赞功能**：文章点赞、评论点赞和说说点赞
- **表情系统**：Waline 风格表情包，内置阿鲁表情包和颜文字，后台可配置自定义表情包路径（支持 unpkg 等 CDN），Admin 和 Widget 共享同一套表情逻辑（`scripts/emoji.js`）
- **数据迁移**：支持从 Twikoo、Artalk、Valine 导入评论数据
- **多站点**：支持多站点管理，通过 site_id 隔离数据
- **安全**：IP/邮箱黑名单、域名白名单、评论审核机制

## 项目结构

```
vwd/
├── api/                  # Vercel Serverless Functions（Hono 框架）
│   ├── index.ts          #   路由入口（API 统一入口）
│   └── health.ts         #   独立健康检查端点
├── server/               # API 逻辑层（Hono 路由 + 业务逻辑）
│   ├── app.ts            #   Hono 应用实例与路由注册
│   ├── admin.ts          #   管理后台 API 逻辑（设置、评论管理、说说管理等）
│   ├── public.ts         #   公开 API（评论、点赞、配置）
│   ├── say.ts            #   说说公开 API（列表、详情、点赞）
│   ├── auth.ts           #   管理员鉴权中间件（基于 Vercel KV）
│   ├── db.ts             #   Vercel Postgres 数据库访问层
│   ├── kv.ts             #   Vercel KV 封装
│   ├── email.ts          #   邮件发送（nodemailer）
│   ├── s3.ts             #   S3 兼容存储客户端（aws4fetch）
│   ├── commentSettings.ts#   评论设置读写
│   ├── featureSettings.ts#   功能开关设置
│   ├── saySettings.ts    #   说说设置读写
│   └── utils.ts          #   通用工具（IP 获取、UA 解析、头像等）
├── scripts/              # 共享脚本
│   ├── emoji.js          #   表情包共享逻辑（Admin 和 Widget 通用，通过 @shared 别名引入）
│   └── init-db.cjs       #   数据库初始化脚本
├── admin/                # 管理后台前端（Vue 3 + Vite + TypeScript）
│   ├── src/
│   │   ├── api/          #   API 请求封装
│   │   ├── components/   #   通用组件（EmojiPicker、CountTo、TagInput）
│   │   ├── composables/  #   组合式函数（主题、站点、配色）
│   │   ├── locales/      #   中文语言包
│   │   ├── router/       #   路由配置
│   │   ├── styles/       #   样式（LESS + 暗黑模式）
│   │   ├── utils/        #   工具（emoji.ts — 引入共享表情逻辑）
│   │   └── views/        #   页面组件
│   ├── index.html
│   ├── vite.config.ts    #   @shared 别名指向 ../scripts
│   └── package.json
├── widget/               # 评论 Widget（前端嵌入组件）
│   ├── src/
│   │   ├── core/         #   主类 VWDComments + API 通信 + 状态管理
│   │   ├── components/   #   UI 组件（评论表单、列表、回复、说说、表情选择器等）
│   │   ├── utils/        #   工具函数（markdown、emotion、日期、验证等）
│   │   ├── styles/       #   样式（CSS Variables + 暗黑模式）
│   │   ├── locales/      #   中文语言包
│   │   └── index.js      #   入口文件
│   ├── vite.config.js    #   @shared 别名指向 ../scripts
│   └── package.json
├── public/               # 静态资源（构建时自动生成）
│   ├── admin/            #   Admin SPA 构建产物（.gitignore）
│   ├── vwd.js            #   Widget 构建产物（.gitignore）
│   ├── icon.png          #   项目图标
│   ├── index.html        #   首页引导页
│   ├── 404.html          #   404 页面
│   └── emotion/          #   表情图片资源（含 alus 表情包 + 颜文字）
├── sql/
│   └── schema.sql        #   PostgreSQL 数据表定义
├── docs/
│   └── hexo-integration.md #  Hexo 博客接入指南
├── vercel.json           #   Vercel 配置（路由、CORS、函数超时）
├── tsconfig.json         #   TypeScript 配置（API + Server 层）
└── package.json
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
| 国际化 | vue-i18n（仅中文） |
| 样式 | LESS + CSS Variables（暗黑模式） |

## 快速部署（GitHub + Vercel 一站式）

### 前置要求

- GitHub 账号
- Vercel 账号（可使用 GitHub 登录）

### 方式一：GitHub 一键部署（推荐）

#### 1. Fork / 克隆仓库

```bash
git clone https://github.com/s-Ruthless/Vercel-Workers-Discuss.git
cd Vercel-Workers-Discuss
```

或直接在 GitHub 上 Fork 本仓库。

#### 2. 在 Vercel 导入仓库

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 **Add New → Project**
3. 选择你 Fork 的仓库 `Vercel-Workers-Discuss`
4. Vercel 会自动识别 `vercel.json` 配置，无需手动设置：
   - **Build Command**：`npm run build`（自动构建 Widget + Admin）
   - **Output Directory**：`public`
   - **Install Command**：`npm install`
5. 点击 **Deploy**，等待构建完成

#### 3. 创建数据库资源

在 Vercel 控制台中创建以下资源（与项目关联到同一个 Scope）：

1. **Vercel Postgres** — 存储 评论、设置、说说数据
2. **Vercel KV** — 管理会话 Token 和限流

创建方式：Vercel 控制台 → **Storage** → **Create** → 选择 Postgres / KV

#### 4. 关联数据库到项目

1. 进入项目 **Settings → Storage**
2. 将创建的 Postgres 和 KV 实例连接到本项目
3. 以下环境变量会**自动注入**，无需手动配置：

| 变量名 | 说明 |
| --- | --- |
| `POSTGRES_URL` | Vercel Postgres 连接地址 |
| `KV_REST_API_URL` | Vercel KV REST API 地址 |
| `KV_REST_API_TOKEN` | Vercel KV REST API Token |

#### 5. 重新部署（关联数据库后）

关联数据库后，在 Vercel 控制台点击 **Redeploy**，或在 GitHub 上推送任意 commit 触发自动部署。

> 数据库表会在首次 API 请求时**自动创建**（`ensureSchema`），无需手动初始化。

#### 6. 设置管理员账号

部署成功后，打开 `https://your-project.vercel.app/admin/`，首次访问会引导你设置管理员账号和密码。

### 方式二：Vercel CLI 部署

```bash
# 克隆并安装
git clone https://github.com/s-Ruthless/Vercel-Workers-Discuss.git
cd Vercel-Workers-Discuss
npm install

# 登录 Vercel
npx vercel login

# 部署（包含构建）
npm run deploy

# 或分步操作
npm run build        # 构建 Widget + Admin
npx vercel --prod    # 部署到生产环境
```

### 部署成功后

| 地址 | 说明 |
| --- | --- |
| `https://your-project.vercel.app/api/health` | 健康检查 |
| `https://your-project.vercel.app/admin/` | 管理后台（首次访问引导设置管理员） |
| `https://your-project.vercel.app/vwd.js` | Widget JS 文件 |
| `https://your-project.vercel.app/emotion/` | 表情图片资源 |

### 后续更新

GitHub 仓库推送代码后，Vercel 会**自动拉取并重新构建部署**，无需任何手动操作。

```bash
git add .
git commit -m "update: your changes"
git push origin main
# Vercel 自动触发部署
```

> **注意**：确保修改的源文件使用 UTF-8 编码（无 BOM），否则 Vercel 构建时可能报 `SyntaxError: Invalid or unexpected token`。

## 接入组件

### 方式一：使用 VWD Widget（推荐）

VWD 内置 Widget，部署后自动构建到 `public/vwd.js`，可通过你的域名直接引用：

```html
<!-- 评论组件 -->
<div id="vwd-comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    apiBaseUrl: 'https://your-project.vercel.app',
    el: '#vwd-comments'
  }).mount();
</script>
```

设置 `mode: 'says'` 可在独立页面展示说说列表：

```html
<!-- 说说组件 -->
<div id="vwd-says"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    apiBaseUrl: 'https://your-project.vercel.app',
    el: '#vwd-says',
    mode: 'says'
  }).mount();
</script>
```

#### 配置项

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `el` | `string\|HTMLElement` | 是 | 挂载元素选择器或 DOM 元素 |
| `apiBaseUrl` | `string` | 是 | API 基础地址 |
| `mode` | `'says'` | 否 | 设为 `'says'` 开启说说渲染功能，在独立页面展示说说列表（默认评论模式） |
| `siteId` | `string` | 否 | 站点 ID，用于多站点隔离 |
| `theme` | `'light'\|'dark'` | 否 | 主题，默认 `light` |
| `pageSize` | `number` | 否 | 每页评论数，默认 `20`（说说也可从后台设置） |
| `lang` | `'zh-CN'` | 否 | 语言，默认 `zh-CN` |
| `primaryColor` | `string` | 否 | 主题色（hex 格式，如 `#0969da`） |
| `customCssUrl` | `string` | 否 | 自定义 CSS 文件 URL |

> 说说开关、每页数量等可在后台 `/admin/settings` 中配置，前端自动读取。

#### 本地开发 Widget

```bash
cd widget
npm install
npm run dev   # 启动开发服务器（http://localhost:5173）
npm run build # 构建到 dist/ 并自动复制到 ../public/vwd.js
```

### 方式二：直接调用 API

```html
<!-- 获取评论列表 -->
<script>
  fetch('https://your-project.vercel.app/api/comments?post_slug=/your-page')
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
| DELETE | `/api/comments/like` | 取消评论点赞 |
| POST | `/api/verify-admin` | 管理员评论验证 |
| GET | `/api/like` | 获取文章点赞状态 |
| POST | `/api/like` | 文章点赞 |
| GET | `/api/says` | 获取说说列表 |
| GET | `/api/says/:id` | 获取单条说说 |
| POST | `/api/says/like` | 说说点赞 |
| GET | `/api/config/comments` | 获取公开配置（含表情包路径） |
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
| GET | `/api/admin/stats/*` | 评论统计 |
| GET/POST/PUT/DELETE | `/api/admin/says/*` | 说说管理 |
| GET/PUT | `/api/admin/settings/says` | 说说设置 |

> 所有管理 API（除 login 外）需在请求头中携带 `Authorization: Bearer <token>`。

## 数据库表结构

| 表名 | 说明 |
| --- | --- |
| `Comment` | 评论数据（昵称、邮箱、内容、状态、点赞数等） |
| `Settings` | 系统设置（键值对存储） |
| `Likes` | 点赞记录（文章点赞、说说点赞，按 user_id 去重） |
| `Say` | 说说/动态（Markdown 内容、状态、标签等） |

完整定义见 [sql/schema.sql](./sql/schema.sql)。

## 环境变量说明

| 变量 | 必需 | 说明 |
| --- | --- | --- |
| `POSTGRES_URL` | 是 | Vercel Postgres 连接地址（Vercel 自动注入） |
| `KV_REST_API_URL` | 是 | Vercel KV REST API 地址（Vercel 自动注入） |
| `KV_REST_API_TOKEN` | 是 | Vercel KV REST API Token（Vercel 自动注入） |

> 管理员账号和密码在部署后通过 `/admin/` 页面首次设置，存储在数据库中，无需环境变量。

以下配置在 Admin 后台的设置页面中配置，存储在数据库中：

- **管理员账户**：首次部署时通过页面设置
- **SMTP 配置**：发件邮箱、SMTP 服务器、端口、授权码
- **Telegram 配置**：Bot Token、Chat ID
- **S3 配置**：Endpoint、Region、Bucket、Access Key、Secret Key

## 本地开发

```bash
# 一键安装所有依赖（根目录 + admin + widget）
npm run install:all

# 启动 Vercel Dev（包含 API + Admin 热更新）
npm run dev

# 单独开发 Admin 前端
cd admin && npm run dev

# 单独开发 Widget
cd widget && npm run dev
```

> 项目包含三个独立的 `package.json`（根目录服务端、`admin/` 后台前端、`widget/` 评论组件），`npm run install:all` 会一次性安装全部三个目录的依赖。
>
> Admin 和 Widget 通过 `@shared` 别名引用 `scripts/emoji.js` 中的共享表情逻辑。Vite 配置中 `@shared` 分别指向 `../scripts`。

## 构建脚本

```bash
# 完整构建（Widget + Admin 前端）
npm run build

# 仅构建 Widget
npm run build:widget

# 仅构建 Admin 前端
npm run build:admin

# 初始化数据库
npm run db:init

# 部署到 Vercel
npm run deploy
```

> 表情图片资源（`public/emotion/`）已随仓库提交，构建时无需额外复制步骤。

## License

[Apache-2.0](./LICENSE)
