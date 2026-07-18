<div align="center">

# VWD (Vercel Workers Discuss)

[中文](./README.md) | **English**

![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?logo=vercel&logoColor=white&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/Vercel-Postgres-4169E1?logo=postgresql&logoColor=white&style=flat-square)
![KV](https://img.shields.io/badge/Vercel-KV-FF0000?logo=redis&logoColor=white&style=flat-square)
![Hono](https://img.shields.io/badge/Hono-Web%20Framework-E36002?logo=hono&logoColor=white&style=flat-square)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white&style=flat-square)
![Node.js](https://img.shields.io/badge/node-%3E=20.0.0-339933?logo=node.js&logoColor=white&style=flat-square)
![License](https://img.shields.io/badge/License-Apache--2.0-blue?style=flat-square)

A self-hosted comment system built on the Vercel Serverless platform, using Vercel Postgres and Vercel KV for data storage.

Deeply integrated with the Vercel ecosystem — works out of the box.

This project is inspired by [CWD](https://github.com/anghunk/cwd) (Cloudflare Workers Discuss) and [Waline](https://waline.js.org/) comment systems.

</div>

## Features

- **Comment System**: Nested replies, Markdown rendering, XSS filtering, image lightbox
- **Moments**: Bloggers can post short updates/microblogs with Markdown, emoji, tags, and likes
- **Admin Panel**: Standalone SPA built with Vue 3 + Vite, macOS-style UI, supports dark mode, Chinese/English bilingual switch, custom accent colors
- **Email Notifications**: SMTP email notifications with custom templates, compatible with QQ/163 mail
- **Telegram Notifications**: Real-time push of new comments to Telegram, one-click Webhook setup
- **S3 Backup**: Compatible with AWS S3 / Cloudflare R2 / MinIO, supports backup and restore
- **Likes**: Article likes, comment likes, and moment likes (moment likes can be toggled in admin feature settings, enabled by default)
- **Emoji System**: Waline-style emoji packs, built-in Alus emoji pack and kaomoji, custom emoji pack paths configurable in admin (supports unpkg and other CDNs). Admin and Widget share the same emoji logic (`scripts/emoji.js`)
- **Data Migration**: Import comments from Twikoo, Artalk, Valine
- **Multi-site**: Multi-site management with data isolation via site_id
- **Security**: IP/email blocklists, domain allowlist, comment review mechanism

## Project Structure

```
vwd/
├── api/                  # Vercel Serverless Functions (Hono framework)
│   ├── index.ts          #   Route entry (unified API entry)
│   └── health.ts         #   Standalone health check endpoint
├── server/               # API logic layer (Hono routes + business logic)
│   ├── app.ts            #   Hono app instance and route registration
│   ├── admin.ts          #   Admin API logic (settings, comment management, moment management, etc.)
│   ├── public.ts         #   Public API (comments, likes, config)
│   ├── say.ts            #   Moments public API (list, detail, like)
│   ├── auth.ts           #   Admin auth middleware (based on Vercel KV)
│   ├── db.ts             #   Vercel Postgres database access layer
│   ├── kv.ts             #   Vercel KV wrapper
│   ├── email.ts          #   Email sending (nodemailer)
│   ├── s3.ts             #   S3-compatible storage client (aws4fetch)
│   ├── commentSettings.ts#   Comment settings read/write
│   ├── featureSettings.ts#   Feature toggle settings
│   ├── saySettings.ts    #   Moments settings read/write
│   └── utils.ts          #   Utilities (IP detection, UA parsing, avatar, etc.)
├── scripts/              # Shared scripts
│   ├── emoji.js          #   Shared emoji logic (used by both Admin and Widget via @shared alias)
│   └── init-db.cjs       #   Database initialization script
├── admin/                # Admin panel frontend (Vue 3 + Vite + TypeScript)
│   ├── src/
│   │   ├── api/          #   API request wrappers
│   │   ├── components/   #   Common components (EmojiPicker, CountTo, TagInput)
│   │   ├── composables/  #   Composables (theme, site, accent color)
│   │   ├── locales/      #   Chinese/English language packs (zh-CN / en)
│   │   ├── router/       #   Router config
│   │   ├── styles/       #   Styles (LESS + dark mode)
│   │   ├── utils/        #   Utilities (emoji.ts — imports shared emoji logic)
│   │   └── views/        #   Page components
│   ├── index.html
│   ├── vite.config.ts    #   @shared alias points to ../scripts
│   └── package.json
├── widget/               # Comment Widget (frontend embed component)
│   ├── src/
│   │   ├── core/         #   Main class VWDComments + API communication + state management
│   │   ├── components/   #   UI components (comment form, list, reply, moments, emoji picker, etc.)
│   │   ├── utils/        #   Utility functions (markdown, emotion, date, validation, etc.)
│   │   ├── styles/       #   Styles (CSS Variables + dark mode)
│   │   ├── locales/      #   Language pack (Chinese only)
│   │   └── index.js      #   Entry file
│   ├── vite.config.js    #   @shared alias points to ../scripts
│   └── package.json
├── public/               # Static assets (auto-generated at build time)
│   ├── admin/            #   Admin SPA build output (.gitignore)
│   ├── vwd.js            #   Widget build output (.gitignore)
│   ├── icon.png          #   Project icon
│   ├── index.html        #   Landing page
│   ├── 404.html          #   404 page
│   └── emotion/          #   Emoji image assets (includes alus pack + kaomoji)
├── sql/
│   └── schema.sql        #   PostgreSQL table definitions
├── docs/                       # VitePress docs site (accessible at /doc)
│   ├── .vitepress/config.ts    #   VitePress config (base: /doc/)
│   ├── index.md                #   Docs homepage
│   ├── guide/                  #   Guides (quick start, deploy, Hexo, widget config, says)
│   ├── api/                    #   API docs
│   └── common-problems.md      #   FAQ
├── vercel.json           #   Vercel config (routes, CORS, function timeout)
├── tsconfig.json         #   TypeScript config (API + Server layer)
└── package.json
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Vercel Serverless (Node.js 20+) |
| Web Framework | Hono + `hono/vercel` adapter |
| Database | Vercel Postgres (Neon PostgreSQL) |
| Key-Value Store | Vercel KV (Upstash Redis) |
| Email | nodemailer |
| S3 Storage | aws4fetch |
| Admin Frontend | Vue 3 + Vite + TypeScript |
| Charts | ECharts |
| i18n | vue-i18n (Admin supports Chinese/English, Widget Chinese only) |
| Styling | LESS + CSS Variables (dark mode) |

## Quick Deployment (GitHub + Vercel All-in-One)

### Prerequisites

- GitHub account
- Vercel account (can sign in with GitHub)

### Option 1: GitHub One-Click Deploy (Recommended)

#### 1. Fork / Clone the repository

```bash
git clone https://github.com/s-Ruthless/Vercel-Workers-Discuss.git
cd Vercel-Workers-Discuss
```

Or simply Fork this repository on GitHub.

#### 2. Import the repository on Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Select your Forked repository `Vercel-Workers-Discuss`
4. Vercel will auto-detect the `vercel.json` config — no manual setup needed:
   - **Build Command**: `npm run build` (auto-builds Widget + Admin)
   - **Output Directory**: `public`
   - **Install Command**: `npm install`
5. Click **Deploy** and wait for the build to complete

#### 3. Create database resources

Create the following resources in the Vercel console (linked to the same Scope as the project):

1. **Vercel Postgres** — stores comments, settings, moments data
2. **Vercel KV** — manages session tokens and rate limiting

How to create: Vercel Console → **Storage** → **Create** → select Postgres / KV

#### 4. Link databases to the project

1. Go to the project **Settings → Storage**
2. Connect the created Postgres and KV instances to this project
3. The following environment variables will be **auto-injected** — no manual config needed:

| Variable | Description |
| --- | --- |
| `POSTGRES_URL` | Vercel Postgres connection URL |
| `KV_REST_API_URL` | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Vercel KV REST API Token |

#### 5. Redeploy (after linking databases)

After linking the databases, click **Redeploy** in the Vercel console, or push any commit to GitHub to trigger auto-deployment.

> Database tables are **auto-created** on the first API request (`ensureSchema`) — no manual initialization needed.

#### 6. Set up admin account

After successful deployment, open `https://your-project.vercel.app/admin/`. The first visit will guide you through setting up an admin account and password.

### Option 2: Vercel CLI Deployment

```bash
# Clone and install
git clone https://github.com/s-Ruthless/Vercel-Workers-Discuss.git
cd Vercel-Workers-Discuss
npm install

# Login to Vercel
npx vercel login

# Deploy (includes build)
npm run deploy

# Or step-by-step
npm run build        # Build Widget + Admin
npx vercel --prod    # Deploy to production
```

### After Deployment

| URL | Description |
| --- | --- |
| `https://your-project.vercel.app/api/health` | Health check |
| `https://your-project.vercel.app/admin/` | Admin panel (first visit guides admin setup) |
| `https://your-project.vercel.app/vwd.js` | Widget JS file |
| `https://your-project.vercel.app/emotion/` | Emoji image assets |

### Future Updates

After pushing code to the GitHub repository, Vercel will **automatically pull and rebuild** — no manual action needed.

```bash
git add .
git commit -m "update: your changes"
git push origin main
# Vercel auto-triggers deployment
```

> **Note**: Ensure modified source files use UTF-8 encoding (no BOM), otherwise Vercel may report `SyntaxError: Invalid or unexpected token` during build.

## Widget Integration

### Option 1: Use VWD Widget (Recommended)

VWD includes a built-in Widget, auto-built to `public/vwd.js` after deployment. You can reference it directly via your domain:

```html
<!-- Comment component -->
<div id="vwd-comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    apiBaseUrl: 'https://your-project.vercel.app',
    el: '#vwd-comments'
  }).mount();
</script>
```

Set `mode: 'says'` to display moments list on a standalone page:

```html
<!-- Moments component -->
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

#### Configuration Options

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `el` | `string\|HTMLElement` | Yes | Mount element selector or DOM element |
| `apiBaseUrl` | `string` | Yes | API base URL |
| `mode` | `'says'` | No | Set to `'says'` to enable moments rendering on a standalone page (default: comment mode) |
| `siteId` | `string` | No | Site ID for multi-site isolation |
| `theme` | `'light'\|'dark'` | No | Theme, default `light` |
| `pageSize` | `number` | No | Comments per page, default `20` (moments can also be configured in admin) |
| `lang` | `'zh-CN'` | No | Language, default `zh-CN` |
| `primaryColor` | `string` | No | Accent color (hex format, e.g. `#0969da`) |
| `customCssUrl` | `string` | No | Custom CSS file URL |

> Moment likes, toggle, page size, etc. can be configured in admin `/admin/settings` under feature toggles. The frontend reads them automatically.

#### Local Widget Development

```bash
cd widget
npm install
npm run dev   # Start dev server (http://localhost:5173)
npm run build # Build to dist/ and auto-copy to ../public/vwd.js
```

### Option 2: Direct API Calls

```html
<!-- Get comment list -->
<script>
  fetch('https://your-project.vercel.app/api/comments?post_slug=/your-page')
    .then(res => res.json())
    .then(data => console.log(data));
</script>
```

## API Overview

### Public API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/comments` | Get comment list |
| POST | `/api/comments` | Submit a comment |
| POST | `/api/comments/like` | Like a comment |
| DELETE | `/api/comments/like` | Unlike a comment |
| POST | `/api/verify-admin` | Admin comment verification |
| GET | `/api/like` | Get article like status |
| POST | `/api/like` | Like an article |
| GET | `/api/says` | Get moments list |
| GET | `/api/says/:id` | Get a single moment |
| POST | `/api/says/like` | Like a moment |
| GET | `/api/config/comments` | Get public config (includes emoji pack paths) |
| GET | `/api/health` | Health check |

### Admin API (Authentication Required)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/comments/list` | Comment list |
| DELETE | `/api/admin/comments/delete` | Delete comment |
| PUT | `/api/admin/comments/status` | Update comment status |
| PUT | `/api/admin/comments/update` | Edit comment |
| GET/PUT | `/api/admin/settings/*` | Various settings |
| GET/POST | `/api/admin/export/*` | Data export |
| POST | `/api/admin/import/*` | Data import |
| GET | `/api/admin/stats/*` | Comment statistics |
| GET/POST/PUT/DELETE | `/api/admin/says/*` | Moment management |
| GET/PUT | `/api/admin/settings/says` | Moment settings |

> All admin APIs (except login) require an `Authorization: Bearer <token>` header.

## Database Tables

| Table | Description |
| --- | --- |
| `Comment` | Comment data (nickname, email, content, status, like count, etc.) |
| `Settings` | System settings (key-value storage) |
| `Likes` | Like records (article likes, moment likes, deduplicated by user_id) |
| `Say` | Moments/microblogs (Markdown content, status, tags, etc.) |

See [sql/schema.sql](./sql/schema.sql) for full definitions.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `POSTGRES_URL` | Yes | Vercel Postgres connection URL (auto-injected by Vercel) |
| `KV_REST_API_URL` | Yes | Vercel KV REST API URL (auto-injected by Vercel) |
| `KV_REST_API_TOKEN` | Yes | Vercel KV REST API Token (auto-injected by Vercel) |

> Admin account and password are set via the `/admin/` page after deployment and stored in the database — no environment variables needed.

The following configurations are managed in the Admin settings page and stored in the database:

- **Admin Account**: Set via the page on first deployment
- **SMTP Config**: Sender email, SMTP server, port, auth code
- **Telegram Config**: Bot Token, Chat ID
- **S3 Config**: Endpoint, Region, Bucket, Access Key, Secret Key

## Local Development

```bash
# Install all dependencies at once (root + admin + widget)
npm run install:all

# Start Vercel Dev (includes API + Admin hot reload)
npm run dev

# Develop Admin frontend only
cd admin && npm run dev

# Develop Widget only
cd widget && npm run dev
```

> The project contains three independent `package.json` files (root server, `admin/` frontend, `widget/` comment component). `npm run install:all` installs all three at once.
>
> Admin and Widget reference the shared emoji logic in `scripts/emoji.js` via the `@shared` alias. In the Vite configs, `@shared` points to `../scripts`.

## Build Scripts

```bash
# Full build (Widget + Admin frontend)
npm run build

# Build Widget only
npm run build:widget

# Build Admin frontend only
npm run build:admin

# Initialize database
npm run db:init

# Deploy to Vercel
npm run deploy
```

> Emoji image assets (`public/emotion/`) are committed to the repository — no extra copy step needed during build.

## License

[Apache-2.0](./LICENSE)
