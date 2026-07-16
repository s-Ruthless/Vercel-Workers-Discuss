import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

// 缓存初始化状态，避免每次路由切换都请求 API
let setupStatus: boolean | null = null;

// 允许外部更新缓存状态（设置完成后调用）
export function setSetupStatus(value: boolean) {
  setupStatus = value;
}

const routes: RouteRecordRaw[] = [
  {
    path: '/setup',
    name: 'setup',
    component: () => import('../views/SetupView/index.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView/index.vue'),
  },
  {
    path: '/',
    component: () => import('../views/LayoutView/index.vue'),
    children: [
      {
        path: '',
        redirect: '/stats',
      },
      {
        path: 'stats',
        name: 'stats',
        component: () => import('../views/StatsView/index.vue'),
        meta: { title: '数据看板' },
      },
      {
        path: 'comments',
        name: 'comments',
        component: () => import('../views/CommentsView/index.vue'),
        meta: { title: '评论管理' },
      },
      {
        path: 'says',
        name: 'says',
        component: () => import('../views/SaysView/index.vue'),
        meta: { title: '说说管理' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('../views/SettingsView/index.vue'),
        meta: { title: '网站设置' },
      },
      {
        path: 'data',
        name: 'data',
        component: () => import('../views/DataView/index.vue'),
        meta: { title: '数据管理' },
      },
      {
        path: 'sites',
        name: 'sites',
        component: () => import('../views/SitesView/index.vue'),
        meta: { title: '站点管理' },
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const storedTitle = localStorage.getItem('vwd_admin_site_title');
  const defaultTitle = storedTitle || 'VWD 评论系统';
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - ${defaultTitle}`;
  } else {
    document.title = defaultTitle;
  }

  // 检查初始化状态（仅首次加载时请求）
  if (setupStatus === null) {
    try {
      const { checkSetupStatus } = await import('../api/admin');
      const res = await checkSetupStatus();
      setupStatus = res.setupCompleted;
    } catch {
      setupStatus = false; // 请求失败时默认未初始化，跳转 setup 页面
    }
  }

  // 未初始化 → 强制跳转 setup
  if (!setupStatus && to.name !== 'setup') {
    next({ name: 'setup' });
    return;
  }

  // 已初始化 → 不允许再访问 setup
  if (setupStatus && to.name === 'setup') {
    next({ name: 'login' });
    return;
  }

  if (to.name === 'login' || to.name === 'setup') {
    next();
    return;
  }
  const token = localStorage.getItem('vwd_admin_token');
  if (!token) {
    next({ name: 'login' });
    return;
  }
  next();
});

router.afterEach((to, from) => {
  if (to.name !== from.name) {
    const layoutContent = document.querySelector('.layout-content');
    if (layoutContent instanceof HTMLElement) {
      layoutContent.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }
});
