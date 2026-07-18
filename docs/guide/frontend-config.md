# 前端配置

**这里提供一套开箱即用的 Widget 组件，如果是个人开发者可以根据 [API 文档](./../api/overview) 自行编写前端评论组件。**

组件源码目录：`/widget`

## 组件特性

VWD 评论组件采用 **Shadow DOM** 技术构建，基于独立根节点渲染，具备以下优势：

- **样式隔离**：组件样式完全独立，不会与宿主页面的样式产生冲突
- **DOM 隔离**：组件内部 DOM 结构与外部页面完全隔离，互不干扰
- **即插即用**：无需担心现有网站的样式框架（如 Bootstrap、Tailwind 等）影响组件显示
- **自定义样式**：通过 `customCssUrl` 参数注入自定义样式表，灵活调整外观

## 评论组件初始化

在初始化 `VWDComments` 实例时，可以传入以下配置参数：

```html
<div id="comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>
<script>
  const comments = new VWDComments({
    el: '#comments',                                    // 必填
    apiBaseUrl: 'https://your-project.vercel.app',     // 必填，换成你的 API 地址
    postSlug: 'post-unique-id-001',                     // 选填，自定义评论标识符
    siteId: 'blog',                                     // 选填，用于多站点数据隔离
    lang: 'zh-CN',                                      // 选填，评论组件语言
  });
  comments.mount();
</script>
```

如果你的站点是多语言结构（例如 `/en/post/1` 和 `/zh/post/1`），或者是不同路径需要共享同一份评论数据，可以通过 `postSlug` 参数手动指定唯一的标识符；

如果未指定 `postSlug`，组件将默认使用 `window.location.pathname` 作为标识符。

### 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | 是 | — | 挂载元素选择器或 DOM 元素 |
| `apiBaseUrl` | `string` | 是 | — | API 基础地址 |
| `siteId` | `string` | 否 | `blog` | 站点 ID，用于多站点数据隔离，推荐配置 |
| `postSlug` | `string` | 否 | `window.location.pathname` | 自定义评论标识符，用于跨路径/多语言聚合 |
| `postTitle` | `string` | 否 | `document.title` | 文章标题（用于通知邮件） |
| `postUrl` | `string` | 否 | `window.location.origin + pathname` | 文章 URL（用于通知邮件） |
| `mode` | `'says'` | 否 | — | 设为 `'says'` 开启说说渲染功能 |
| `lang` | `'zh-CN'` | 否 | `zh-CN` | 评论组件语言代码 |
| `theme` | `'light' \| 'dark'` | 否 | `'light'` | 主题模式 |
| `pageSize` | `number` | 否 | `20` | 每页显示评论数 |
| `primaryColor` | `string` | 否 | `#0969da` | 主题色（hex 格式） |
| `customCssUrl` | `string` | 否 | — | 自定义样式表 URL，追加到 Shadow DOM 底部 |

### 多语言配置说明

评论组件语言的优先级如下：

1. 前端实例化时传入的 `lang` 参数（最高优先级）
2. 浏览器语言自动检测

目前支持的语言：`zh-CN`（中文）

头像前缀、博主邮箱和标识等信息由后端接口 `/api/config/comments` 提供，无需在前端进行配置。

当后台「评论设置」中配置了"评论博主邮箱"（`adminEmail`）时：

- 前台组件会将该邮箱视为"管理员邮箱"；
- 使用该邮箱发表评论时，会在邮箱输入框失焦后触发"管理员身份验证"弹窗；
- 验证通过后，会在浏览器本地保存一次管理员密钥；
- 后端会在 `/api/comments` 中校验此密钥，确保管理员身份的评论需要额外验证；
- 后端邮件通知会将新评论提醒发送到该邮箱，无需再单独配置通知收件人。

## 实例方法

| 方法 | 说明 |
| --- | --- |
| `mount()` | 挂载组件到 DOM |
| `unmount()` | 卸载组件 |
| `updateConfig(config)` | 更新配置（支持动态切换主题等） |
| `getConfig()` | 获取当前配置 |

**使用示例**

```javascript
// 动态切换主题
comments.updateConfig({ theme: 'dark' });

// 动态修改评论标识符（适用于单页应用路由切换）
comments.updateConfig({ postSlug: '/new-post-slug' });

// 配置自定义样式（会以 <link> 形式注入到 Shadow DOM 底部）
comments.updateConfig({
  customCssUrl: 'https://your-cdn.example.com/vwd-custom.css',
});
```

## 其他框架示例

如果你有其他博客框架的需求，欢迎在 [GitHub Issues](https://github.com/s-Ruthless/Vercel-Workers-Discuss/issues) 中反馈。

### HTML

此方法适用于绝大多数博客框架，包括 Hexo、Hugo、Jekyll、WordPress 等。

```html
<div id="comments"></div>
<script src="https://your-project.vercel.app/vwd.js"></script>

<!-- 实例调用 -->
<script>
  const comments = new VWDComments({
    el: '#comments',
    apiBaseUrl: 'https://your-project.vercel.app', // 换成你的 API 地址
  });
  comments.mount();
</script>
```

### Astro

```astro
<div id="comments"></div>
<script src="https://your-project.vercel.app/vwd.js" is:inline></script>

<script is:inline>
  document.addEventListener('DOMContentLoaded', () => {
    const comments = new VWDComments({
      el: '#comments',
      apiBaseUrl: 'https://your-project.vercel.app',
    });
    comments.mount();
  });
</script>
```

### Vue3

安装 `npm i vwd-widget`（或直接引用 CDN）

```html
<div id="comments"></div>
```

```js
import VWDComments from 'vwd-widget';

onMounted(() => {
  const comments = new VWDComments({
    el: '#comments',
    apiBaseUrl: 'https://your-project.vercel.app',
  });
  comments.mount();
});
```

### Vue2

```html
<div id="comments"></div>
```

```js
import VWDComments from 'vwd-widget';

// 放在 mounted 钩子中初始化评论组件
mounted() {
  const comments = new VWDComments({
    el: '#comments',
    apiBaseUrl: 'https://your-project.vercel.app',
  });
  comments.mount();
},
```

### React

```jsx
import { useEffect, useRef } from 'react';
import VWDComments from 'vwd-widget';

function Comments() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const comments = new VWDComments({
      el: containerRef.current,
      apiBaseUrl: 'https://your-project.vercel.app',
    });
    comments.mount();

    return () => {
      comments.unmount();
    };
  }, []);

  return <div id="comments" ref={containerRef} />;
}

export default Comments;
```
