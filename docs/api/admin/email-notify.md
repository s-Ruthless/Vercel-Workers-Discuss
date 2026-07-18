# 邮件通知

邮件通知配置相关接口，用于配置 SMTP 服务器和邮件提醒功能。

所有接口均需要 Bearer Token 鉴权。

## 获取邮件通知配置

```
GET /api/admin/settings/email-notify
```

获取邮件通知配置。

**成功响应**

- 状态码：`200`

```json
{
  "data": {
    "enableEmailNotify": true,
    "smtpHost": "smtp.example.com",
    "smtpPort": 465,
    "smtpUser": "noreply@example.com",
    "smtpSecure": true,
    "emailTemplate": "..."
  }
}
```

::: tip 安全说明
接口不会返回 SMTP 密码，密码字段始终为空或脱敏显示。
:::

## 更新邮件通知配置

```
PUT /api/admin/settings/email-notify
```

更新邮件通知配置。

**请求体**

```json
{
  "enableEmailNotify": true,
  "smtpHost": "smtp.example.com",
  "smtpPort": 465,
  "smtpUser": "noreply@example.com",
  "smtpPass": "your-smtp-password",
  "smtpSecure": true,
  "emailTemplate": "自定义邮件模板 HTML"
}
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `enableEmailNotify` | boolean | 是 | 是否启用邮件通知 |
| `smtpHost` | string | 是 | SMTP 服务器地址 |
| `smtpPort` | integer | 是 | SMTP 端口 |
| `smtpUser` | string | 是 | SMTP 用户名 |
| `smtpPass` | string | 否 | SMTP 密码（留空表示不修改） |
| `smtpSecure` | boolean | 否 | 是否使用 SSL/TLS |
| `emailTemplate` | string | 否 | 自定义邮件模板 |

**成功响应**

- 状态码：`200`

```json
{ "message": "配置已保存" }
```

## 测试邮件发送

```
POST /api/admin/settings/email-test
```

测试邮件通知配置是否正确，会向管理员邮箱发送一封测试邮件。

**成功响应**

- 状态码：`200`

```json
{ "message": "测试邮件已发送" }
```

**错误响应**

| 状态码 | 说明 | 响应 |
| --- | --- | --- |
| `500` | 发送失败 | `{ "message": "邮件发送失败: ..." }` |
