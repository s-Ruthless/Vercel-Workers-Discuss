# 管理 API

所有管理 API（除 login 外）需在请求头中携带 `Authorization: Bearer <token>`。

## 管理员登录

```
POST /api/admin/login
```

### 请求体

```json
{
  "username": "admin",
  "password": "your-password"
}
```

### 响应示例

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "token": "bearer-token-string"
  }
}
```

## 评论管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/comments/list` | 评论列表（支持分页、筛选） |
| DELETE | `/api/admin/comments/delete` | 删除评论 |
| PUT | `/api/admin/comments/status` | 更新评论状态（通过/拒绝/待审核） |
| PUT | `/api/admin/comments/update` | 编辑评论内容 |

## 设置管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET/PUT | `/api/admin/settings/comments` | 评论设置 |
| GET/PUT | `/api/admin/settings/says` | 说说设置 |
| GET/PUT | `/api/admin/settings/features` | 功能开关 |
| GET/PUT | `/api/admin/settings/smtp` | SMTP 邮件配置 |
| GET/PUT | `/api/admin/settings/telegram` | Telegram 通知配置 |
| GET/PUT | `/api/admin/settings/s3` | S3 备份配置 |
| GET/PUT | `/api/admin/settings/security` | 安全设置（黑名单、白名单） |

## 数据导出

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/export/comments` | 导出评论数据 |
| GET | `/api/admin/export/says` | 导出说说数据 |
| GET | `/api/admin/export/all` | 导出全部数据 |

## 数据导入

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/admin/import/twikoo` | 从 Twikoo 导入 |
| POST | `/api/admin/import/artalk` | 从 Artalk 导入 |
| POST | `/api/admin/import/valine` | 从 Valine 导入 |

## 统计

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/stats/overview` | 总览数据 |
| GET | `/api/admin/stats/comments` | 评论趋势统计 |
| GET | `/api/admin/stats/visitors` | 访客统计 |
