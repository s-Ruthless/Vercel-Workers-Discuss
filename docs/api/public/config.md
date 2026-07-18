# 配置接口

公开配置接口，用于前端获取评论系统的公开配置信息。

## 获取公开配置

```
GET /api/config/comments
```

获取评论系统的公开配置，包括表情包路径、博主邮箱、头像前缀等信息。前端组件在初始化时会自动调用此接口。

- 方法：`GET`
- 路径：`/api/config/comments`
- 鉴权：不需要

**成功响应**

- 状态码：`200`

```json
{
  "data": {
    "adminEmail": "admin@example.com",
    "avatarPrefix": "https://weavatar.com/avatar",
    "adminBadge": "博主",
    "emojiPaths": ["https://unpkg.com/@waline/emojis@1.1.0/alus"],
    "enableCommentLike": true,
    "enableArticleLike": true,
    "enableImageLightbox": false,
    "enableEmoji": true,
    "commentPlaceholder": "发表你的看法..."
  }
}
```

**字段说明**

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `adminEmail` | string \| null | 博主邮箱，用于前台管理员身份验证 |
| `avatarPrefix` | string \| null | 头像服务前缀地址 |
| `adminBadge` | string \| null | 博主标签文字 |
| `emojiPaths` | string[] | 表情包路径列表 |
| `enableCommentLike` | boolean | 是否启用评论点赞 |
| `enableArticleLike` | boolean | 是否启用文章点赞 |
| `enableImageLightbox` | boolean | 是否启用图片灯箱 |
| `enableEmoji` | boolean | 是否启用表情 |
| `commentPlaceholder` | string \| null | 评论框提示文案 |
