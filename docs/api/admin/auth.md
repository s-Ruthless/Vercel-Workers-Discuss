# 身份认证

管理员身份认证相关接口。

## 管理员登录

```
POST /api/admin/login
```

管理员登录，获取后续接口调用所需的 Bearer Token。

- 方法：`POST`
- 路径：`/api/admin/login`
- 鉴权：不需要

**请求头**

| 名称 | 必填 | 示例 |
| --- | --- | --- |
| `Content-Type` | 是 | `application/json` |

**请求体**

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `email` | string | 是 | 管理员邮箱 |
| `password` | string | 是 | 管理员密码 |

**成功响应**

- 状态码：`200`

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "email": "admin@example.com"
  }
}
```

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `token` | string | Bearer Token，用于后续管理员接口鉴权 |
| `admin.email` | string | 管理员邮箱 |

**错误响应**

| 状态码 | 说明 | 响应 |
| --- | --- | --- |
| `401` | 邮箱或密码错误 | `{ "message": "邮箱或密码错误" }` |

::: tip Token 使用说明
登录成功后，在后续所有管理员接口的请求头中携带：

```
Authorization: Bearer <token>
```
:::
