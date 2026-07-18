# 点赞 API

## 获取文章点赞状态

```
GET /api/like
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `post_slug` | `string` | 是 | 文章唯一标识 |
| `site_id` | `string` | 否 | 站点 ID，默认 `blog` |

### 响应示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "count": 42,
    "liked": false
  }
}
```

## 文章点赞

```
POST /api/like
```

### 请求体

```json
{
  "post_slug": "/your-page",
  "site_id": "blog",
  "user_id": "user-unique-id"
}
```

> 点赞按 `user_id` 去重，同一用户对同一文章只能点赞一次。
