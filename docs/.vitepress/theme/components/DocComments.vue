<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRoute } from 'vitepress';

const route = useRoute();
const container = ref<HTMLElement | null>(null);
let vwdInstance: any = null;
let scriptLoaded = false;

const SITE_ID = 'vwd-doc';

async function loadScript(): Promise<void> {
  if (scriptLoaded || (window as any).VWDComments) {
    scriptLoaded = true;
    return;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/vwd.js';
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load vwd.js'));
    document.head.appendChild(script);
  });
}

async function mountComments() {
  if (!container.value) return;
  try {
    await loadScript();
    const VWDComments = (window as any).VWDComments;
    if (!VWDComments) return;

    // 先卸载旧实例
    if (vwdInstance) {
      try { vwdInstance.unmount(); } catch {}
      vwdInstance = null;
    }

    vwdInstance = new VWDComments({
      el: container.value,
      apiBaseUrl: window.location.origin,
      siteId: SITE_ID,
      postSlug: window.location.pathname,
    });
    vwdInstance.mount();
  } catch (e) {
    // 静默失败，不影响文档站正常使用
  }
}

onMounted(() => {
  // 延迟挂载，等 DOM 稳定
  nextTick(() => setTimeout(mountComments, 100));
});

// 路由切换时重新挂载评论
watch(() => route.path, () => {
  nextTick(() => setTimeout(mountComments, 100));
});
</script>

<template>
  <div class="vwd-doc-comments">
    <div ref="container" class="vwd-doc-comments-container"></div>
  </div>
</template>

<style scoped>
.vwd-doc-comments {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--vp-c-divider);
}

.vwd-doc-comments-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>
