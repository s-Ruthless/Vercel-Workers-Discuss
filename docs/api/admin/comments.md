# 评论管理

评论管理相关接口，用于后台管理页面查看、审核、编辑和删除评论。

所有接口均需要 Bearer Token 鉴权。

## 获取评论列表

```
GET /api/admin/comments/list
```

获取评论列表，用于后台管理页面展示。

**查询参数**

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `siteId` | string | 否 | 站点 ID，默认 `blog` |
| `page` | integer | 否 | 页码，默认 `1` |
| `pageSize` | integer | 否 | 每页数量，默认 `20` |
| `status` | string | 否 | 筛选状态：`approved` / `pending` / `rejected` |
| `keyword` | string | 否 | 搜索关键词 |

**成功响应**

- 状态码：`200`

```json
{
  "data": [...],
  "pagination": { "page": 1, "pageSize": 20, "total": 100 }
}
```

## 更新评论状态

```
PUT /api/admin/comments/status
```

更新评论状态（通过 / 拒绝）。

**请求体**

```json
{ "id": 123, "status": "approved" }
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 评论 ID |
| `status` | string | 是 | 新状态：`approved` / `pending` / `rejected` |

**成功响应**

- 状态码：`200`

```json
{ "message": "状态已更新" }
```

## 更新评论内容

```
PUT /api/admin/comments/update
```

更新评论的详细信息（昵称、内容、置顶等）。

**请求体**

```json
{
  "id": 123,
  "author": "新昵称",
  "content": "修改后的内容",
  "priority": 1
}
```

**成功响应**

- 状态码：`200`

```json
{ "message": "评论已更新" }
```

## 删除指定评论

```
DELETE /api/admin/comments/delete
```

删除指定评论及其所有回复。

**查询参数**

| 名称 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | number | 是 | 评论 ID |

**成功响应**

- 状态码：`200`

```json
{ "message": "评论已删除" }
```

## 加入 IP 黑名单

```
POST /api/admin/comments/block-ip
```

将指定 IP 加入评论黑名单。

**请求体**

```json
{ "ip": "192.168.1.1" }
```

**成功响应**

- 状态码：`200`

```json
{ "message": "IP 已加入黑名单" }
```

## 加入邮箱黑名单

```
POST /api/admin/comments/block-email
```

将指定邮箱加入评论黑名单。

**请求体**

```json
{ "email": "spam@example.com" }
```

**成功响应**

- 状态码：`200`

```json
{ "message": "邮箱已加入黑名单" }
```
