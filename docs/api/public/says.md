# 说说接口

说说（动态/短博文）相关的公开接口。

## 获取说说列表

```
GET /api/says
```

获取说说列表，支持分页。

- 方法：`GET`
- 路径：`/api/says`
- 鉴权：不需要

**查询参数**

| 名称 | 位置 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `siteId` | query | string | 否 | 站点 ID，默认 `blog` |
| `page` | query | integer | 否 | 页码，默认 `1` |
| `pageSize` | query | integer | 否 | 每页数量，默认从后台设置读取 |

**成功响应**

- 状态码：`200`

```json
{
  "data": [
    {
      "id": 1,
      "content": "今天发布了新文章！",
      "contentHtml": "<p>今天发布了新文章！</p>",
      "pubDate": "2026-01-13T10:00:00Z",
      "tags": ["日常", "更新"],
      "likes": 5,
      "status": "approved"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 5
  }
}
```

## 获取单条说说

```
GET /api/says/:id
```

获取指定 ID 的说说详情。

- 方法：`GET`
- 路径：`/api/says/:id`
- 鉴权：不需要

**路径参数**

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 说说 ID |

**成功响应**

- 状态码：`200`

```json
{
  "data": {
    "id": 1,
    "content": "今天发布了新文章！",
    "contentHtml": "<p>今天发布了新文章！</p>",
    "pubDate": "2026-01-13T10:00:00Z",
    "tags": ["日常", "更新"],
    "likes": 5
  }
}
```

## 说说点赞

```
POST /api/says/like
```

对指定说说进行点赞操作。

- 方法：`POST`
- 路径：`/api/says/like`
- 鉴权：不需要

**请求体**

```json
{ "say_id": 1, "user_id": "user-unique-id" }
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `say_id` | number | 是 | 说说 ID |
| `user_id` | string | 是 | 用户唯一标识，用于去重 |

**成功响应**

- 状态码：`200`

```json
{ "message": "点赞成功", "likes": 6 }
```
