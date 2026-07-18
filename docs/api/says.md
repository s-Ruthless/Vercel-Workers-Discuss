# 说说 API

## 获取说说列表

```
GET /api/says
```

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `site_id` | `string` | 否 | 站点 ID，默认 `blog` |
| `page` | `number` | 否 | 页码，默认 `1` |
| `pageSize` | `number` | 否 | 每页数量，默认从后台设置读取 |

## 获取单条说说

```
GET /api/says/:id
```

### 路径参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 说说 ID |

## 说说点赞

```
POST /api/says/like
```

### 请求体

```json
{
  "say_id": 1,
  "user_id": "user-unique-id"
}
```

## 说说管理 API（需鉴权）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/admin/says/list` | 获取说说列表（管理） |
| POST | `/api/admin/says/create` | 发布说说 |
| PUT | `/api/admin/says/update` | 编辑说说 |
| DELETE | `/api/admin/says/delete` | 删除说说 |
| GET/PUT | `/api/admin/settings/says` | 说说设置 |
