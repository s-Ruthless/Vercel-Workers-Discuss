# 常见问题

十分抱歉！

由于开发团队目前只有一个人，在更新功能后文档可能会滞后。如果遇到问题，请先查看文档是否有更新。
如果文档没有更新或者文档描述与实际有误，请在 GitHub 仓库的 Issues 中及时反馈。
如果是更改比较重大的功能，我会在 [常见问题] 中更新。

## 1. 为什么设置完 siteId 后，评论区不显示旧的评论数据？

因为设置了 siteId 后，接口会根据 siteId 来查询数据库带有你设置的 siteId 的评论数据。所以如果设置了 siteId，旧数据就有可能不显示，需要手动去 Vercel Postgres 控制台执行 SQL 语句来更新数据。

- `abc` 你要设置的 siteId
- `example.com` 查找包含指定域名的评论数据

```sql
UPDATE "Comment" SET site_id = 'abc' WHERE post_url LIKE '%example.com%';
```

运行以上 SQL 语句后，评论区就会显示带有 `abc` siteId 的评论数据了。

## 2. 评论框不显示

- 检查浏览器控制台是否有报错
- 确认 `apiBaseUrl` 地址正确，末尾不要加 `/`
- 确认 `vwd.js` 能正常加载（在浏览器地址栏直接访问该 URL）
- 确认 `el` 选择器对应的元素存在于页面中

## 3. 评论提交后不显示

- 登录管理后台 `/admin/`，检查是否开启了「评论审核」（开启后新评论需手动审批）
- 检查评论是否被 `IP/邮箱黑名单` 拦截

## 4. 指定文章的自定义标识

默认情况下，VWD 使用页面路径（`window.location.pathname`）作为文章标识。如果你的文章 URL 变了（比如换了域名或路径结构），评论会丢失。可以通过显式指定 `postSlug` 来固定标识：

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://your-project.vercel.app',
  postSlug: 'my-first-post'  // 使用固定标识，不随 URL 变化
}).mount();
```

## 5. 邮件通知不生效

- 在 `/admin/settings` 中正确配置 SMTP 服务器、端口、发件邮箱、授权码
- 注意 QQ 邮箱使用授权码而非密码，163 邮箱同理
- 检查服务器是否屏蔽了邮件端口

## 6. Telegram 通知不生效

- 在 `/admin/settings` 中配置 Bot Token 和 Chat ID
- Chat ID 可以通过给 @userinfobot 发消息获取
- 确认 Bot 已被加入到目标群组（如果发到群组）
- 确认已点击「一键设置 Webhook」

## 7. Vercel 构建报 SyntaxError

确保修改的源文件使用 UTF-8 编码（无 BOM），否则 Vercel 构建时可能报 `SyntaxError: Invalid or unexpected token`。

## 8. 文档站如何访问

部署成功后，文档站地址为：

```
https://your-project.vercel.app/doc/
```

也可以通过 `/doc`（不带斜杠）访问，会自动重定向到 `/doc/`。
