# API 总览

VWD 提供完整的 REST API，支持评论、点赞、说说、管理等功能。

## 基础地址

```
https://your-project.vercel.app/api
```

## 公开 API

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

## 管理 API（需鉴权）

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

## 直接调用 API 示例

```html
<!-- 获取评论列表 -->
<script>
  fetch('https://your-project.vercel.app/api/comments?post_slug=/your-page')
    .then(res => res.json())
    .then(data => console.log(data));
</script>
```

## CORS 支持

所有 `/api/*` 端点均开启 CORS，允许任意域名调用：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-VWD-Like-User, X-CWD-Like-User
```

> 表情包已改为前端配置（Waline 风格），不再提供 `/api/emotions` 接口。内置阿鲁表情包和颜文字，可在后台 `/admin/settings` 中配置自定义表情包路径。
