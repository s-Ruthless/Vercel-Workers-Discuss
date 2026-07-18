# 常见问题

## 1. 评论框不显示

- 检查浏览器控制台是否有报错
- 确认 `apiBaseUrl` 地址正确，末尾不要加 `/`
- 确认 `vwd.js` 能正常加载（在浏览器地址栏直接访问该 URL）
- 确认 `el` 选择器对应的元素存在于页面中

## 2. 评论提交后不显示

- 登录管理后台 `/admin/`，检查是否开启了「评论审核」（开启后新评论需手动审批）
- 检查评论是否被 `IP/邮箱黑名单` 拦截

## 3. 多个博客共用一套评论系统

为不同博客设置不同的 `siteId`：

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://your-project.vercel.app',
  siteId: 'tech-blog'  // 技术博客
}).mount();
```

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://your-project.vercel.app',
  siteId: 'life-blog'  // 生活博客
}).mount();
```

## 4. 指定文章的自定义标识

默认情况下，VWD 使用页面路径（`window.location.pathname`）作为文章标识。如果你的文章 URL 变了（比如换了域名或路径结构），评论会丢失。可以通过显式指定 `postSlug` 来固定标识：

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://your-project.vercel.app',
  postSlug: 'my-first-post'  // 使用固定标识，不随 URL 变化
}).mount();
```

## 5. 只在特定页面显示评论

如果使用 Hexo 注入器方式，可以通过 `'post'` 参数控制：

```js
hexo.extend.injector.register('body_end', `
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://your-project.vercel.app'
  }).mount();
</script>
`, 'post');  // 'post' 表示仅在文章页注入
```

可选值：`home`（首页）、`post`（文章页）、`page`（自定义页面）、`archive`（归档页）、`category`（分类页）、`tag`（标签页）。

## 6. 邮件通知不生效

- 在 `/admin/settings` 中正确配置 SMTP 服务器、端口、发件邮箱、授权码
- 注意 QQ 邮箱使用授权码而非密码，163 邮箱同理
- 检查服务器是否屏蔽了邮件端口

## 7. Telegram 通知不生效

- 在 `/admin/settings` 中配置 Bot Token 和 Chat ID
- Chat ID 可以通过给 @userinfobot 发消息获取
- 确认 Bot 已被加入到目标群组（如果发到群组）

## 8. 数据库表未自动创建

数据库表会在首次 API 请求时**自动创建**（`ensureSchema`）。如果没有创建：

- 检查 Vercel Postgres 是否已正确关联到项目
- 检查 `POSTGRES_URL` 环境变量是否注入
- 手动执行 `npm run db:init` 初始化

## 9. Vercel 构建报 SyntaxError

确保修改的源文件使用 UTF-8 编码（无 BOM），否则 Vercel 构建时可能报 `SyntaxError: Invalid or unexpected token`。

## 10. 文档站如何访问

部署成功后，文档站地址为：

```
https://your-project.vercel.app/doc/
```

也可以通过 `/doc`（不带斜杠）访问，会自动重定向到 `/doc/`。
