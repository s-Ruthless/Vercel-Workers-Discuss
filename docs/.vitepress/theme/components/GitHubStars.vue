<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stars = ref<number | null>(null)
const repo = 's-Ruthless/Vercel-Workers-Discuss'

onMounted(async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`)
    if (res.ok) {
      const data = await res.json()
      stars.value = data.stargazers_count
    }
  } catch (e) {
    // 静默失败，徽章仍可作为外链使用
  }
})
</script>

<template>
  <a
    :href="`https://github.com/${repo}`"
    class="vwd-github-stars"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="GitHub Stars"
  >
    <svg class="icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
    </svg>
    <span class="text">Star <strong>{{ stars !== null ? stars : '…' }}</strong></span>
  </a>
</template>

<style scoped>
.vwd-github-stars {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-border);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  color: var(--vp-c-text-1);
  text-decoration: none;
  white-space: nowrap;
  transition: border-color 0.25s, color 0.25s, background-color 0.25s;
  margin-left: 8px;
}

.vwd-github-stars:hover {
  border-color: var(--vp-c-text-2);
  color: var(--vp-c-text-1);
}

.vwd-github-stars .icon {
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

.vwd-github-stars strong {
  font-weight: 600;
}

/* 移动端隐藏文字，只保留图标，避免挤占导航 */
@media (max-width: 768px) {
  .vwd-github-stars .text {
    display: none;
  }
  .vwd-github-stars {
    padding: 6px;
    border-radius: 50%;
  }
}
</style>
