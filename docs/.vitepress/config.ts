import { defineConfig } from 'vitepress';

export default defineConfig({
  // 站点部署在 /doc/ 子路径下
  base: '/doc/',
  // 输出到 public/doc/，由 Vercel 作为静态资源直接 serve
  outDir: '../public/doc',
  // 清空输出目录，避免残留旧文件
  cleanUrls: true,

  lang: 'zh-CN',
  title: 'VWD 评论系统文档',
  description: 'Vercel Workers Discuss · 基于 Vercel Serverless 的自托管评论系统',

  head: [
    ['link', { rel: 'icon', href: '/doc/icon.png' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  ],

  themeConfig: {
    siteTitle: 'VWD 文档',
    logo: '/icon.png',

    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: 'API 文档', link: '/api/overview' },
      { text: '常见问题', link: '/common-problems' },
      { text: '管理后台', link: 'https://vwd.zishu.me' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '部署到 Vercel', link: '/guide/deploy' },
            { text: 'Hexo 博客接入', link: '/guide/hexo-integration' },
            { text: 'Widget 配置项', link: '/guide/widget-config' },
            { text: '说说功能', link: '/guide/says' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 文档',
          items: [
            { text: 'API 总览', link: '/api/overview' },
            { text: '评论 API', link: '/api/comments' },
            { text: '说说 API', link: '/api/says' },
            { text: '点赞 API', link: '/api/like' },
            { text: '管理 API', link: '/api/admin' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/s-Ruthless/Vercel-Workers-Discuss' },
    ],

    footer: {
      message: '基于 Vercel Serverless 构建',
      copyright: 'Copyright © 2026 VWD',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询条件',
            backButtonTitle: '关闭',
            noResultsText: '无法找到相关结果',
            footer: {
              selectText: '选择',
              navigateText: '切换',
            },
          },
        },
      },
    },

    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
});
