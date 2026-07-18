# 更新部署

重新拉取 GitHub 项目代码。

## 后端更新

接口逻辑相关的更新，需要重新部署到 Vercel。

```bash
git pull origin main
npm install
npm run build
npx vercel --prod
```

或者直接推送代码到 GitHub，Vercel 会自动触发重新部署（无需手动）。

```bash
git add .
git commit -m "update: your changes"
git push origin main
# Vercel 自动触发部署
```

## 前端更新

### 管理后台

如果你的管理后台是通过 GitHub 仓库部署到 Vercel 的，不需要手动更新，只用拉取官方仓库代码，重新推送即可触发重新部署（无需手动）。

::: warning 注意
存在一个弊端，如果官方后台版本有了大更新，而你部署的 API 端没有及时更新部署，可能会导致管理后台无法正常使用（无法获取到最新的接口），正常情况下无需担心。
:::

如需手动构建管理后台：

```bash
cd admin
npm install
npm run build
```

将打包后的代码（`public/admin/`）随项目一起部署到 Vercel。

### 评论端

更新 API 时，Widget 会自动重新构建到 `public/vwd.js`，无需单独操作。

如需本地开发 Widget：

```bash
cd widget
npm install
npm run dev   # 启动开发服务器
npm run build # 构建到 dist/ 并自动复制到 ../public/vwd.js
```

## 文档站更新

文档站（VitePress）也会在 `npm run build` 时自动构建到 `public/doc/`，无需单独操作。

如需本地预览文档：

```bash
npm run dev:docs
```
