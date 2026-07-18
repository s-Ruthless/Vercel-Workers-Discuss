# 统计数据

统计数据相关接口，用于管理后台数据看板和点赞排行展示。

所有接口均需要 Bearer Token 鉴权。

## 获取评论统计数据

```
GET /api/admin/stats/comments
```

用于管理后台「数据看板」展示评论整体统计。

**查询参数**

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `siteId` | string | 否 | 站点 ID，默认 `blog` |

**成功响应**

- 状态码：`200`

```json
{
  "data": {
    "totalComments": 1523,
    "pendingComments": 5,
    "todayComments": 12,
    "totalSites": 3
  }
}
```

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `totalComments` | number | 评论总数 |
| `pendingComments` | number | 待审核评论数 |
| `todayComments` | number | 今日新增评论数 |
| `totalSites` | number | 站点总数 |

## 获取点赞记录列表

```
GET /api/admin/likes/list
```

获取各页面的点赞记录列表，支持按页面或用户筛选。

**查询参数**

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | integer | 否 | 页码，默认 `1` |
| `pageSize` | integer | 否 | 每页数量，默认 `20` |
| `postSlug` | string | 否 | 按页面筛选 |
| `userId` | string | 否 | 按用户筛选 |

**成功响应**

- 状态码：`200`

```json
{
  "data": [
    {
      "id": 1,
      "postSlug": "/blog/hello-world",
      "postTitle": "Hello World",
      "userId": "user-123",
      "createdAt": "2026-01-13T10:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 100 }
}
```

## 获取点赞统计

```
GET /api/admin/likes/stats
```

获取点赞 Top 页面列表，用于后台展示点赞排行榜。

**查询参数**

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `limit` | integer | 否 | 返回数量，默认 `10` |

**成功响应**

- 状态码：`200`

```json
{
  "data": [
    {
      "postSlug": "/blog/hello-world",
      "postTitle": "Hello World",
      "totalLikes": 120
    }
  ]
}
```
