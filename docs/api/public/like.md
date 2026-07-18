# 点赞接口

文章点赞相关的公开接口。

## 获取点赞状态

```
GET /api/like
```

获取当前页面的点赞状态和总点赞数。

- 方法：`GET`
- 路径：`/api/like`
- 鉴权：不需要

**查询参数**

| 名称 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `post_slug` | query | string | 是 | 页面唯一标识符 |
| `siteId` | query | string | 否 | 站点 ID，默认 `blog` |

**请求头（可选）**

| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `X-VWD-Like-User` | 否 | 前端生成的匿名用户标识，用于区分不同用户 |

**成功响应**

- 状态码：`200`

```json
{
  "liked": false,
  "totalLikes": 12
}
```

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `liked` | boolean | 当前用户是否已点赞 |
| `totalLikes` | number | 当前页面的总点赞数 |

## 点赞文章

```
POST /api/like
```

对当前页面执行点赞操作，同一用户对同一页面只会计入一次点赞。

- 方法：`POST`
- 路径：`/api/like`
- 鉴权：不需要

**请求头**

| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `Content-Type` | 是 | `application/json` |
| `X-VWD-Like-User` | 否 | 前端生成的匿名用户标识 |

**请求体**

```json
{
  "post_slug": "/blog/hello-world",
  "post_title": "博客标题，可选",
  "post_url": "https://example.com/blog/hello-world"
}
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `post_slug` | string | 是 | 页面唯一标识符 |
| `post_title` | string | 否 | 页面标题，用于点赞统计显示 |
| `post_url` | string | 否 | 页面 URL，用于点赞统计跳转 |
| `siteId` | string | 否 | 站点 ID，默认 `blog` |

**成功响应**

- 状态码：`200`

```json
{
  "liked": true,
  "totalLikes": 13
}
```

说明：

- 第一次点赞：`liked=true`，`totalLikes` 增加 1
- 重复点赞：服务器不会重复插入记录，`totalLikes` 不会继续增加
