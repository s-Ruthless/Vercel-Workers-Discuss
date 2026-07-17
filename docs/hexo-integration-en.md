# Hexo Blog Integration Guide for VWD Comment System

**English** | [中文](./hexo-integration.md)

## Prerequisites

- VWD comment system deployed (assume URL is `https://vercel-workers-discuss.vercel.app`)
- Admin initialization completed in the `/admin/` panel

---

## General Integration (Works with All Hexo Themes)

### Step 1: Locate the article template file

Hexo theme article templates are usually located at (choose based on your theme):

| Theme | File Path |
| --- | --- |
| NexT | `themes/next/layout/_macro/post.swig` or `themes/next/layout/post.njk` |
| Butterfly | `themes/butterfly/layout/post.pug` |
| Fluid | `themes/fluid/layout/post.ejs` |
| Matery | `themes/matery/layout/post.ejs` |
| Volantis | `themes/volantis/layout/layout.ejs` |
| Custom | `themes/<theme-name>/layout/post.ejs` |

> If unsure, check the `themes/<your-theme>/layout/` directory for files related to `post`.

### Step 2: Insert comment code after the article

After the `</article>` tag or the article content end tag in your template file, add the following code:

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

### Step 3: Regenerate your blog

```bash
hexo clean && hexo generate
```

---

## Theme-Specific Tutorials

### Butterfly Theme

**Method 1: Via Injector (Recommended)**

Edit `themes/butterfly/_config.yml` (or site `_config.butterfly.yml`):

```yaml
inject:
  bottom:
    - <div id="vwd-comments" style="max-width:800px;margin:2rem auto;"></div>
    - <script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
    - <script>new VWDComments({el:'#vwd-comments',apiBaseUrl:'https://vercel-workers-discuss.vercel.app'}).mount();</script>
```

**Method 2: Replace Built-in Comment System**

Edit `themes/butterfly/layout/comment.pug`, add at the end of the file:

```pug
//- VWD Comments
#vwd-comments(style="max-width:800px;margin:2rem auto;")
script(src="https://vercel-workers-discuss.vercel.app/vwd.js")
script.
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
```

---

### NexT Theme

**Method 1: Custom File (Recommended)**

1. Create file `source/_data/body-end.njk` (if using Nunjucks) or `source/_data/body-end.swig`:

```html
{% if page.comments %}
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
{% endif %}
```

2. Enable in `_config.next.yml`:

```yaml
custom_file_path:
  body_end: source/_data/body-end.njk
```

**Method 2: Directly Edit Theme Files**

Edit `themes/next/layout/_partials/comments.swig`, add at the end:

```html
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Fluid Theme

Edit `themes/fluid/layout/post.ejs`, add before `<%- partial('_partial/footer') %>`:

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Matery Theme

Edit `themes/matery/layout/post.ejs`, add after the `</div>` that closes the article content:

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Volantis Theme

Edit `themes/volantis/layout/_partial/article.njk`, add after the article content:

```html
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

### Hexo Default Theme (landscape)

Edit `themes/landscape/layout/post.ejs`, replace `<%- partial('comment') %>` with:

```html
<!-- VWD Comments -->
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
```

---

## Via Hexo Injector (No Theme Modification, Recommended)

Hexo 5.0+ supports the `inject` injector — no need to modify theme files:

Create `scripts/vwd-comments.js` in your blog root directory:

```js
'use strict';

hexo.extend.injector.register('body_end', `
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
`, 'post');
```

> `'post'` means it's only injected on article pages. Run `hexo generate` to apply.

---

## Configuration Options

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | Yes | — | Mount element selector or DOM element |
| `apiBaseUrl` | `string` | Yes | — | VWD comment system API URL |
| `mode` | `'says'` | No | — | Set to `'says'` to enable moments rendering on a standalone page |
| `siteId` | `string` | No | `blog` | Site ID for multi-site isolation |
| `postSlug` | `string` | No | `window.location.pathname` | Unique article identifier |
| `postTitle` | `string` | No | `document.title` | Article title (used in notification emails) |
| `postUrl` | `string` | No | `window.location.origin + window.location.pathname` | Article URL (used in notification emails) |
| `theme` | `'light' \| 'dark'` | No | `light` | Theme |
| `pageSize` | `number` | No | `20` | Comments per page |
| `lang` | `'zh-CN'` | No | `zh-CN` | UI language (Chinese only currently) |
| `primaryColor` | `string` | No | `#0969da` | Accent color (hex format) |
| `customCssUrl` | `string` | No | — | Custom CSS file URL |

### Usage Example

```html
<div id="vwd-comments"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    siteId: 'my-blog',
    theme: 'dark',
    lang: 'zh-CN',
    pageSize: 10,
    primaryColor: '#0969da'
  }).mount();
</script>
```

---

## Moments Feature

VWD supports moments (short updates/microblogs). Bloggers can post moments in the admin panel at `/admin/says`, then create a standalone page to display the moments list.

### Display Moments on a Standalone Page

Create a Hexo page (e.g. `hexo new page says`), include `VWDComments` with `mode: 'says'`:

```html
<div id="vwd-says" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-says',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    mode: 'says'
  }).mount();
</script>
```

### Via Hexo Injector

Create `scripts/vwd-says.js` in your blog root directory:

```js
'use strict';

hexo.extend.injector.register('body_end', `
<div id="vwd-says" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-says',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    mode: 'says'
  }).mount();
</script>
`, 'page');  // Inject on page-type pages
```

### Moments Configuration

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | Yes | — | Mount element selector or DOM element |
| `apiBaseUrl` | `string` | Yes | — | VWD comment system API URL |
| `mode` | `'says'` | Yes | — | Set to `'says'` to enable moments rendering |
| `siteId` | `string` | No | `blog` | Site ID |
| `pageSize` | `number` | No | `10` | Moments per page (also configurable in admin) |
| `theme` | `'light' \| 'dark'` | No | `light` | Theme |
| `primaryColor` | `string` | No | `#0969da` | Accent color |

> Moment toggle, likes, page size, etc. can also be configured in admin `/admin/settings`. The frontend automatically reads server config.

---

## Dark Mode Adaptation

### Auto-Follow System

```html
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }).mount();
</script>
```

### Listen for Theme Switch (For Hexo Themes with Dark Mode Toggle)

```html
<div id="vwd-comments"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  const vwd = new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
    theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  });
  vwd.mount();

  // Listen for theme switch (adjust selector and attribute name for your theme)
  const observer = new MutationObserver(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    vwd.updateConfig({ theme: isDark ? 'dark' : 'light' });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
</script>
```

---

## FAQ

### 1. Comment box not showing

- Check the browser console for errors
- Make sure `apiBaseUrl` is correct — no trailing `/`
- Make sure `vwd.js` loads properly (open the URL directly in the browser)
- Make sure the element matching the `el` selector exists on the page

### 2. Comments not showing after submission

- Log in to the admin panel at `/admin/` and check if "Comment Review" is enabled (when enabled, new comments need manual approval)
- Check if the comment was blocked by `IP/Email Blocklist`

### 3. Multiple blogs sharing one comment system

Set different `siteId` for different blogs:

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
  siteId: 'tech-blog'  // Tech blog
}).mount();
```

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
  siteId: 'life-blog'  // Life blog
}).mount();
```

### 4. Custom article identifier

By default, VWD uses the page path (`window.location.pathname`) as the article identifier. If your article URL changes (e.g. domain change or path structure change), comments will be lost. You can fix this by explicitly specifying `postSlug`:

```js
new VWDComments({
  el: '#vwd-comments',
  apiBaseUrl: 'https://vercel-workers-discuss.vercel.app',
  postSlug: 'my-first-post'  // Use a fixed identifier that doesn't change with URL
}).mount();
```

### 5. Show comments only on specific pages

If using the injector method, you can control it with conditions:

```js
hexo.extend.injector.register('body_end', `
<div id="vwd-comments" style="max-width: 800px; margin: 2rem auto;"></div>
<script src="https://vercel-workers-discuss.vercel.app/vwd.js"></script>
<script>
  new VWDComments({
    el: '#vwd-comments',
    apiBaseUrl: 'https://vercel-workers-discuss.vercel.app'
  }).mount();
</script>
`, 'post');  // 'post' means inject only on article pages
```

Available values: `home` (homepage), `post` (article page), `page` (custom page), `archive` (archive page), `category` (category page), `tag` (tag page).

---

## API Quick Reference

For custom development, you can call the API directly:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/comments?post_slug=/your-page` | Get comment list |
| POST | `/api/comments` | Submit a comment |
| POST | `/api/comments/like` | Like a comment |
| GET | `/api/like?post_slug=/your-page` | Get article like status |
| POST | `/api/like` | Like an article |
| GET | `/api/says` | Get moments list |
| GET | `/api/says/:id` | Get a single moment |
| POST | `/api/says/like` | Like a moment |
| GET | `/api/config/comments` | Get public config |

> Emoji packs are now frontend-configured (Waline style). The `/api/emotions` endpoint is no longer provided. Built-in Alus emoji pack and kaomoji are included. Custom emoji pack paths can be configured in admin `/admin/settings`.

For the full API documentation, see the project root `README.md`.
