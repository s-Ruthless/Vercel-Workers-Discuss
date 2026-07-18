# 评论设置

评论显示和管理配置相关接口。

所有接口均需要 Bearer Token 鉴权。

## 获取评论配置

```
GET /api/admin/settings/comments
```

获取评论配置信息。

**成功响应**

- 状态码：`200`

```json
{
  "data": {
    "enableCommentLike": true,
    "enableArticleLike": true,
    "enableImageLightbox": false,
    "enableEmoji": true,
    "commentPlaceholder": "发表你的看法...",
    "adminEmail": "admin@example.com",
    "avatarPrefix": "https://weavatar.com/avatar",
    "adminBadge": "博主",
    "emojiPaths": ["https://unpkg.com/@waline/emojis@1.1.0/alus"],
    "enableAudit": false,
    "enableNotify": true
  }
}
```

## 更新评论配置

```
PUT /api/admin/settings/comments
```

更新评论配置。

**请求体**

```json
{
  "enableCommentLike": true,
  "enableArticleLike": false,
  "enableEmoji": true,
  "commentPlaceholder": "说点什么吧...",
  "adminBadge": "站长",
  "enableAudit": true,
  "enableNotify": true
}
```

**成功响应**

- 状态码：`200`

```json
{ "message": "配置已保存" }
```
