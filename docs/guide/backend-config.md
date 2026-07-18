# 后端配置

## 部署条件

- 拥有一个 [GitHub](https://github.com) 账号
- 拥有一个 [Vercel](https://vercel.com) 账号（可使用 GitHub 登录）
- Node.js >= 20（本地开发需要）

VWD 后端基于 Vercel Serverless + Hono 框架实现，使用 Vercel Postgres 存储数据、Vercel KV 管理会话与限流。

## 自部署

### 方式一：GitHub + Vercel 一键部署（推荐）

#### 1. Fork / 克隆仓库

```bash
git clone https://github.com/s-Ruthless/Vercel-Workers-Discuss.git
cd Vercel-Workers-Discuss
```

或直接在 GitHub 上 Fork [Vercel-Workers-Discuss](https://github.com/s-Ruthless/Vercel-Workers-Discuss) 仓库。

#### 2. 在 Vercel 导入仓库

1. 登录 [Vercel 控制台](https://vercel.com/dashboard)
2. 点击 **Add New → Project**
3. 选择你 Fork 的仓库 `Vercel-Workers-Discuss`
4. Vercel 会自动识别 `vercel.json` 配置，无需手动设置：
   - **Build Command**：`npm run build`（自动构建 Widget + Admin + 文档）
   - **Output Directory**：`public`
   - **Install Command**：`npm install`
5. 点击 **Deploy**，等待构建完成

#### 3. 创建数据库资源

在 Vercel 控制台中创建以下资源（与项目关联到同一个 Scope）：

1. **Vercel Postgres** — 存储评论、设置、说说数据
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

#### 5. 重新部署并设置管理员

关联数据库后，在 Vercel 控制台点击 **Redeploy**。

> 数据库表会在首次 API 请求时**自动创建**（`ensureSchema`），无需手动初始化。

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
npm run build        # 构建 Widget + Admin + 文档
npx vercel --prod    # 部署到生产环境
```

## 环境变量与绑定

后端通过 Vercel 的环境变量和绑定资源控制行为。

所需环境变量如下表所示：

| 名称 | 类型 | 必需 | 描述 |
| --- | --- | --- | --- |
| `POSTGRES_URL` | string | 是 | Vercel Postgres 连接地址（自动注入） |
| `KV_REST_API_URL` | string | 是 | Vercel KV REST API 地址（自动注入） |
| `KV_REST_API_TOKEN` | string | 是 | Vercel KV REST API Token（自动注入） |

> 管理员账号和密码在部署后通过 `/admin/` 页面首次设置，存储在数据库中，无需环境变量。

以下配置在 Admin 后台的设置页面中配置，存储在数据库中：

- **管理员账户**：首次部署时通过页面设置
- **SMTP 配置**：发件邮箱、SMTP 服务器、端口、授权码
- **Telegram 配置**：Bot Token、Chat ID
- **S3 配置**：Endpoint、Region、Bucket、Access Key、Secret Key

## 检测部署情况

部署成功后，访问健康检查接口：

```
https://your-project.vercel.app/api/health
```

如果成功，则会返回：

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## 部署完成

| 地址 | 说明 |
| --- | --- |
| `https://your-project.vercel.app/` | 首页引导页 |
| `https://your-project.vercel.app/doc/` | 使用文档 |
| `https://your-project.vercel.app/admin/` | 管理后台 |
| `https://your-project.vercel.app/vwd.js` | Widget JS 文件 |
| `https://your-project.vercel.app/api/health` | 健康检查 |
| `https://your-project.vercel.app/emotion/` | 表情图片资源 |
