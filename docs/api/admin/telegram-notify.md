# Telegram 通知

Telegram Bot 通知配置相关接口。

所有接口均需要 Bearer Token 鉴权。

## 获取 Telegram 配置

```
GET /api/admin/settings/telegram
```

获取 Telegram 通知配置。

**成功响应**

- 状态码：`200`

```json
{
  "data": {
    "enableTelegramNotify": true,
    "botToken": "",
    "chatId": "123456789"
  }
}
```

::: tip 安全说明
接口不会返回 Bot Token 明文，始终为空或脱敏显示。
:::

## 更新 Telegram 配置

```
PUT /api/admin/settings/telegram
```

更新 Telegram 通知配置。

**请求体**

```json
{
  "enableTelegramNotify": true,
  "botToken": "your-bot-token",
  "chatId": "123456789"
}
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `enableTelegramNotify` | boolean | 是 | 是否启用 Telegram 通知 |
| `botToken` | string | 否 | Bot Token（留空表示不修改） |
| `chatId` | string | 是 | 目标 Chat ID |

**成功响应**

- 状态码：`200`

```json
{ "message": "配置已保存" }
```

## 设置 Webhook

```
POST /api/admin/settings/telegram/setup
```

为 Telegram Bot 设置 Webhook。

**成功响应**

- 状态码：`200`

```json
{ "message": "Webhook 设置成功" }
```

## 发送测试消息

```
POST /api/admin/settings/telegram/test
```

向配置的 Chat ID 发送一条测试消息。

**成功响应**

- 状态码：`200`

```json
{ "message": "测试消息已发送" }
```
