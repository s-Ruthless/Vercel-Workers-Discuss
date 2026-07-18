import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import GitHubStars from './components/GitHubStars.vue';

import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // 在导航栏内容之后插入 GitHub Star 徽章（右上角）
      'nav-bar-content-after': () => h(GitHubStars),
    });
  },
};
