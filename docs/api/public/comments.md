# 评论接口

评论相关的公开接口，包括获取评论列表、提交评论、评论点赞等。

## 获取评论列表

```
GET /api/comments
```

获取指定文章的评论列表，支持分页和嵌套结构。

- 方法：`GET`
- 路径：`/api/comments`
- 鉴权：不需要

**查询参数**

| 名称 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `post_slug` | query | string | 是 | 文章 slug，与前端 `VWDComments` 的 `postSlug` 参数对应 |
| `siteId` | query | string | 否 | 站点 ID，用于多站点数据隔离，默认 `blog` |
| `page` | query | integer | 否 | 页码，默认 `1` |
| `limit` | query | integer | 否 | 每页数量，默认 `20`，最大 `50` |

**成功响应**

- 状态码：`200`

```json
{
  "data": [
    {
      "id": 1,
      "author": "张三",
      "email": "zhangsan@example.com",
      "url": "https://example.com",
      "contentText": "很棒的文章！",
      "contentHtml": "很棒的文章！",
      "pubDate": "2026-01-13T10:00:00Z",
      "postSlug": "/blog/hello-world",
      "avatar": "https://weavatar.com/avatar/...",
      "likes": 5,
      "replies": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalCount": 2
  }
}
```

**错误响应**

- 缺少 `post_slug`：状态码 `400`

```json
{ "message": "post_slug is required" }
```

## 提交评论

```
POST /api/comments
```

提交新评论或回复。

- 方法：`POST`
- 路径：`/api/comments`
- 鉴权：不需要

**请求头**

| 名称 | 必填 | 示例 |
| --- | --- | --- |
| `Content-Type` | 是 | `application/json` |

**请求体**

```json
{
  "post_slug": "hello-world",
  "post_title": "博客标题，可选",
  "post_url": "https://example.com/blog/hello-world",
  "name": "张三",
  "email": "zhangsan@example.com",
  "url": "https://zhangsan.me",
  "content": "很棒的文章！",
  "parent_id": 1,
  "adminToken": "your-admin-key"
}
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `post_slug` | string | 是 | 文章 slug |
| `post_title` | string | 否 | 文章标题，用于邮件通知 |
| `post_url` | string | 否 | 文章完整 URL，用于邮件通知跳转 |
| `name` | string | 是 | 评论者昵称 |
| `email` | string | 是 | 评论者邮箱，需为合法邮箱格式 |
| `url` | string | 否 | 评论者个人主页 |
| `content` | string | 是 | 评论内容，支持 Markdown |
| `parent_id` | number | 否 | 父评论 ID，用于回复；缺省表示根评论 |
| `adminToken` | string | 否 | 管理员评论密钥，通过验证后评论直接通过审核 |
| `siteId` | string | 否 | 站点 ID，默认 `blog` |

**成功响应**

- 状态码：`200`

评论直接通过时：
```json
{ "message": "评论已提交", "status": "approved" }
```

评论进入待审核状态时：
```json
{ "message": "已提交评论，待管理员审核后显示", "status": "pending" }
```

**错误响应**

| 状态码 | 说明 | 响应 |
| --- | --- | --- |
| `400` | 缺少必填字段 | `{ "message": "评论内容不能为空" }` |
| `403` | IP/邮箱被限制 | `{ "message": "当前 IP 已被限制评论" }` |
| `401` | 管理员密钥错误 | `{ "message": "密钥错误" }` |
| `429` | 评论频率限制 | `{ "message": "评论频繁，等 10s 后再试" }` |

## 点赞评论

```
POST /api/comments/like
```

对指定评论进行点赞操作。

- 方法：`POST`
- 路径：`/api/comments/like`
- 鉴权：不需要

**请求体**

```json
{ "id": 123, "user_id": "user-unique-id" }
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 评论 ID |
| `user_id` | string | 是 | 用户唯一标识，用于去重 |

**成功响应**

- 状态码：`200`

```json
{ "message": "点赞成功", "likes": 5 }
```

## 取消点赞评论

```
DELETE /api/comments/like
```

取消对指定评论的点赞。

- 方法：`DELETE`
- 路径：`/api/comments/like`
- 鉴权：不需要

**请求体**

```json
{ "id": 123, "user_id": "user-unique-id" }
```

**成功响应**

- 状态码：`200`

```json
{ "message": "取消点赞成功", "likes": 4 }
```
