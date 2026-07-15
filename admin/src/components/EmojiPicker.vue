<template>
  <div class="emoji-picker-wrapper">
    <button class="emoji-toggle" type="button" @click="togglePanel">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    </button>
    <div v-if="panelVisible" class="emoji-panel" @click.stop>
      <div class="emoji-tabs">
        <button
          v-for="(pack, i) in packs"
          :key="pack.name"
          class="emoji-tab"
          :class="{ 'emoji-tab-active': activeTab === i }"
          @click="activeTab = i"
          type="button"
        >
          {{ pack.icon || pack.name }}
        </button>
      </div>
      <div class="emoji-grid">
        <template v-if="packs[activeTab] && packs[activeTab].type === 'text'">
          <button
            v-for="(item, idx) in (packs[activeTab]?.items || [])"
            :key="idx"
            class="emoji-item-text"
            @click="insertText(item)"
            type="button"
          >{{ item }}</button>
        </template>
        <template v-else>
          <button
            v-for="(item, idx) in (packs[activeTab]?.items || [])"
            :key="idx"
            class="emoji-item-img"
            @click="insertImage(packs[activeTab], item)"
            type="button"
          >
            <img
              :src="getEmojiUrl(packs[activeTab], item)"
              :alt="item"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getEmojiPacks, type EmojiPack } from "../utils/emoji";

const props = defineProps<{
  target?: HTMLTextAreaElement | null;
}>();

const emit = defineEmits<{
  (e: "insert", text: string): void;
}>();

const packs = ref<EmojiPack[]>([]);
const panelVisible = ref(false);
const activeTab = ref(0);

function togglePanel() {
  panelVisible.value = !panelVisible.value;
}

function getEmojiUrl(pack: EmojiPack, item: string): string {
  const folder = (pack.folder || "").replace(/\/+$/, "");
  const ext = pack.type || "png";
  const pf = pack.prefix || "";
  return `${folder}/${pf}${item}.${ext}`;
}

function insertText(text: string) {
  emit("insert", text);
}

function insertImage(pack: EmojiPack, item: string) {
  const code = `:${pack.prefix}${item}`;
  emit("insert", code);
}

function closeOnOutside(e: MouseEvent) {
  const el = e.target as HTMLElement;
  if (!el.closest(".emoji-picker-wrapper")) {
    panelVisible.value = false;
  }
}

onMounted(() => {
  packs.value = getEmojiPacks();
  document.addEventListener("click", closeOnOutside);
  return () => {
    document.removeEventListener("click", closeOnOutside);
  };
});
</script>

<style scoped lang="less">
.emoji-picker-wrapper {
  position: relative;
  display: inline-block;
}
.emoji-toggle {
  width: 32px; height: 32px;
  border: 1px solid var(--border-input);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition-fast);
}
.emoji-toggle:hover { background: var(--bg-hover); color: var(--text-primary); }
.emoji-panel {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  width: 280px;
  max-width: calc(100vw - 32px);
  max-height: 260px;
  background: var(--bg-card-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-popover);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
}
.emoji-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
  flex-shrink: 0;
}
.emoji-tab {
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  transition: all var(--transition-fast);
}
.emoji-tab:hover { background: var(--bg-hover); }
.emoji-tab-active { background: var(--bg-active); color: var(--primary-color); font-weight: 600; }
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 2px;
  padding: 8px;
  overflow-y: auto;
  flex: 1;
}
.emoji-item-img {
  width: 36px; height: 36px;
  border: none; background: transparent; cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast);
}
.emoji-item-img:hover { background: var(--bg-hover); }
.emoji-item-img img { width: 28px; height: 28px; object-fit: contain; }
.emoji-item-text {
  width: 36px; height: 36px;
  border: none; background: transparent; cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  transition: background var(--transition-fast);
}
.emoji-item-text:hover { background: var(--bg-hover); }
</style>
