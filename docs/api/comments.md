# 评论 API

## 获取评论列表

```
GET /api/comments
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `post_slug` | `string` | 是 | 文章唯一标识 |
| `site_id` | `string` | 否 | 站点 ID，默认 `blog` |
| `page` | `number` | 否 | 页码，默认 `1` |
| `pageSize` | `number` | 否 | 每页数量，默认 `20` |

### 响应示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

## 提交评论

```
POST /api/comments
```

### 请求体

```json
{
  "post_slug": "/your-page",
  "post_title": "文章标题",
  "post_url": "https://your-blog.com/your-page",
  "nickname": "昵称",
  "email": "email@example.com",
  "link": "https://your-site.com",
  "content": "评论内容（Markdown）",
  "parent_id": null,
  "site_id": "blog"
}
```

## 评论点赞

```
POST /api/comments/like
```

### 请求体

```json
{
  "comment_id": 1,
  "user_id": "user-unique-id"
}
```

## 取消评论点赞

```
DELETE /api/comments/like
```

### 请求体

```json
{
  "comment_id": 1,
  "user_id": "user-unique-id"
}
```

## 管理员评论验证

```
POST /api/verify-admin
```

用于管理员在前端直接发布评论时验证身份，验证通过后评论自动通过审核。
