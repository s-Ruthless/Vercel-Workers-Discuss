# 数据管理

数据导入导出相关接口，用于评论数据迁移和备份。

所有接口均需要 Bearer Token 鉴权。

## 导出所有评论数据

```
GET /api/admin/comments/export
```

导出所有评论数据为 JSON 文件。

**成功响应**

- 状态码：`200`
- 返回 JSON 文件下载

## 导入评论数据

```
POST /api/admin/comments/import
```

导入评论数据，支持 Twikoo / Artalk / VWD JSON 格式。

**请求体**

```json
{
  "data": [...],
  "source": "vwd"
}
```

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `data` | array | 是 | 评论数据数组 |
| `source` | string | 否 | 数据来源：`vwd` / `twikoo` / `artalk`，默认 `vwd` |

**成功响应**

- 状态码：`200`

```json
{ "message": "导入成功", "count": 50 }
```

## 导出配置数据

```
GET /api/admin/export/config
```

导出系统配置（Settings 表）。

**成功响应**

- 状态码：`200`
- 返回 JSON 文件下载

## 导入配置数据

```
POST /api/admin/import/config
```

导入系统配置。

**请求体**

```json
{ "data": {...} }
```

**成功响应**

- 状态码：`200`

```json
{ "message": "配置导入成功" }
```

## 导出访问 / 点赞统计数据

```
GET /api/admin/export/stats
```

导出访问量、按日统计和点赞明细。

**成功响应**

- 状态码：`200`
- 返回 JSON 文件下载

## 导入访问 / 点赞统计数据

```
POST /api/admin/import/stats
```

导入访问和点赞统计。

**请求体**

```json
{ "data": {...} }
```

**成功响应**

- 状态码：`200`

```json
{ "message": "统计导入成功" }
```

## 全量导出（备份）

```
GET /api/admin/export/backup
```

一次性导出评论 + 配置 + 统计数据，用于完整备份。

**成功响应**

- 状态码：`200`
- 返回 JSON 文件下载

## 全量导入（恢复）

```
POST /api/admin/import/backup
```

从备份文件恢复全部数据。

**请求体**

```json
{ "data": {...} }
```

**成功响应**

- 状态码：`200`

```json
{ "message": "恢复成功" }
```
