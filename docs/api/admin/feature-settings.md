# 功能设置

功能开关设置相关接口，控制评论点赞、文章点赞等功能的启用状态。

所有接口均需要 Bearer Token 鉴权。

## 获取功能设置

```
GET /api/admin/settings/features
```

获取功能开关设置。

**成功响应**

- 状态码：`200`

```json
{
  "data": {
    "enableCommentLike": true,
    "enableArticleLike": true,
    "enableImageLightbox": false,
    "enableEmoji": true,
    "enableSays": true
  }
}
```

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `enableCommentLike` | boolean | 是否启用评论点赞 |
| `enableArticleLike` | boolean | 是否启用文章点赞 |
| `enableImageLightbox` | boolean | 是否启用图片灯箱 |
| `enableEmoji` | boolean | 是否启用表情 |
| `enableSays` | boolean | 是否启用说说功能 |

## 更新功能设置

```
PUT /api/admin/settings/features
```

更新功能开关设置。

**请求体**

```json
{
  "enableCommentLike": true,
  "enableArticleLike": false,
  "enableImageLightbox": true,
  "enableEmoji": true,
  "enableSays": false
}
```

**成功响应**

- 状态码：`200`

```json
{ "message": "功能设置已保存" }
```
