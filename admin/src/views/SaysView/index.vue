<template>
  <div class="page">
    <h2 class="page-title">{{ t("says.title") }}</h2>
    <div class="toolbar">
      <div class="toolbar-left">
        <select v-model="statusFilter" class="toolbar-select">
          <option value="">{{ t("says.statusAll") }}</option>
          <option value="published">{{ t("says.statusPublished") }}</option>
          <option value="draft">{{ t("says.statusDraft") }}</option>
          <option value="hidden">{{ t("says.statusHidden") }}</option>
        </select>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-button" @click="openCreateModal">{{ t("says.createBtn") }}</button>
        <button class="toolbar-button" @click="loadSays(page)">↻</button>
      </div>
    </div>
    <div v-if="loading" class="page-hint">{{ t("common.loading") }}</div>
    <div v-else-if="error" class="page-error">{{ error }}</div>
    <div v-else>
      <div class="comment-table">
        <div class="table-header">
          <div class="table-cell table-cell-content">内容</div>
          <div class="table-cell table-cell-tags">标签</div>
          <div class="table-cell table-cell-time">时间</div>
          <div class="table-cell table-cell-status">状态</div>
          <div class="table-cell table-cell-actions">操作</div>
        </div>
        <div v-for="item in filteredSays" :key="item.id" class="table-row">
          <div class="table-cell table-cell-content">
            <div class="cell-content-text" v-html="item.contentHtml"></div>
            <span v-if="item.likes" class="cell-likes-number">
              <PhThumbsUp :size="13" />
              {{ item.likes }}
            </span>
          </div>
          <div class="table-cell table-cell-tags">
            <div class="cell-tags-wrapper" v-if="item.tags && item.tags.length">
              <span v-for="tag in item.tags" :key="tag" class="cell-tag">{{ tag }}</span>
            </div>
          </div>
          <div class="table-cell table-cell-time">
            <span class="cell-time-text">{{ formatDate(item.created) }}</span>
          </div>
          <div class="table-cell table-cell-status">
            <div class="cell-status-wrapper">
              <span class="cell-status" :class="`cell-status-${item.status === 'published' ? 'approved' : item.status === 'draft' ? 'pending' : 'rejected'}`">
                {{ statusLabel(item.status) }}
              </span>
            </div>
          </div>
          <div class="table-cell table-cell-actions">
            <div class="table-actions">
              <select class="status-select" :value="item.status" @change="handleStatusChange(item, $event)">
                <option value="published">{{ t("says.statusPublished") }}</option>
                <option value="draft">{{ t("says.statusDraft") }}</option>
                <option value="hidden">{{ t("says.statusHidden") }}</option>
              </select>
              <button class="table-action" @click="openEditModal(item)">{{ t("says.edit") }}</button>
              <button class="table-action table-action-danger" @click="handleDelete(item.id)">{{ t("says.delete") }}</button>
            </div>
          </div>
        </div>
        <div v-if="filteredSays.length === 0" class="table-empty">
          {{ t("says.empty") }}
        </div>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button class="pagination-button" :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <template v-for="p in visiblePages" :key="p">
          <button
            class="pagination-button"
            :class="{ 'pagination-button-active': p === page }"
            :disabled="p === page"
            @click="goPage(p)"
          >{{ p }}</button>
        </template>
        <button class="pagination-button" :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastVisible" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-success'">{{ toastMessage }}</div>

    <!-- Edit/Create Modal -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3 class="modal-title">{{ editingId ? t("says.editTitle") : t("says.createTitle") }}</h3>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ t("says.content") }}</label>
            <textarea v-model="modalContent" class="form-input" rows="8" :placeholder="t('says.contentPlaceholder')" style="resize: vertical; font-family: inherit;"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t("says.tags") }}</label>
            <input v-model="modalTags" class="form-input" :placeholder="t('says.tagsHint')" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t("says.status") }}</label>
            <select v-model="modalStatus" class="form-input">
              <option value="published">{{ t("says.statusPublished") }}</option>
              <option value="draft">{{ t("says.statusDraft") }}</option>
              <option value="hidden">{{ t("says.statusHidden") }}</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="closeModal" type="button">{{ t("says.cancel") }}</button>
          <button class="modal-btn primary" :disabled="submitting" @click="handleSubmit" type="button">
            <span v-if="submitting">{{ t("says.submitting") }}</span>
            <span v-else>{{ t("says.save") }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "../../styles/markdown.css";
import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { fetchSays, createSay, updateSay, deleteSay, updateSayStatus, type SayItem } from "../../api/admin";
import { useSite } from "../../composables/useSite";
import { initEmojiPacks } from "../../utils/emoji";
import { fetchFeatureSettings } from "../../api/admin";

const { t } = useI18n();
const { currentSiteId } = useSite();

const loading = ref(false);
const error = ref("");
const says = ref<SayItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const statusFilter = ref("");
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);
const submitting = ref(false);

const modalVisible = ref(false);
const editingId = ref<number | null>(null);
const modalContent = ref("");
const modalTags = ref("");
const modalStatus = ref("published");

const filteredSays = computed(() => {
  if (!statusFilter.value) return says.value;
  return says.value.filter((item) => item.status === statusFilter.value);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = page.value;
  const maxVisible = 7;
  if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
  let start = current - Math.floor(maxVisible / 2);
  let end = current + Math.floor(maxVisible / 2);
  if (start < 1) { start = 1; end = maxVisible; }
  else if (end > total) { end = total; start = total - maxVisible + 1; }
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg; toastType.value = type; toastVisible.value = true;
  window.setTimeout(() => { toastVisible.value = false; }, 2000);
}

function statusLabel(status: string): string {
  if (status === "published") return t("says.statusPublished");
  if (status === "draft") return t("says.statusDraft");
  return t("says.statusHidden");
}

function formatDate(value: number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

async function loadSays(targetPage?: number) {
  const p = typeof targetPage === "number" ? targetPage : page.value;
  loading.value = true;
  error.value = "";
  try {
    const res = await fetchSays(p, currentSiteId.value);
    says.value = res.data;
    page.value = res.pagination.page;
    totalPages.value = res.pagination.total;
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  loadSays(p);
}

function handleStatusChange(item: SayItem, event: Event) {
  const target = event.target as HTMLSelectElement;
  const status = target.value;
  if (!status || status === item.status) return;
  changeStatus(item.id, status);
}

async function changeStatus(id: number, status: string) {
  try {
    await updateSayStatus(id, status);
    showToast("状态更新成功");
    await loadSays();
  } catch (e: any) {
    showToast(e.message || "更新失败", "error");
  }
}

function openCreateModal() {
  editingId.value = null;
  modalContent.value = "";
  modalTags.value = "";
  modalStatus.value = "published";
  modalVisible.value = true;
}

function openEditModal(item: SayItem) {
  editingId.value = item.id;
  modalContent.value = item.contentText;
  modalTags.value = item.tags.join(", ");
  modalStatus.value = item.status;
  modalVisible.value = true;
}

function closeModal() {
  if (submitting.value) return;
  modalVisible.value = false;
}

async function handleSubmit() {
  if (!modalContent.value.trim()) { showToast("内容不能为空", "error"); return; }
  submitting.value = true;
  try {
    const tags = modalTags.value.split(",").map(s => s.trim()).filter(Boolean);
    if (editingId.value) {
      await updateSay({ id: editingId.value, content: modalContent.value, status: modalStatus.value, tags });
      showToast("更新成功");
    } else {
      await createSay({ content: modalContent.value, status: modalStatus.value, tags });
      showToast("发布成功");
    }
    modalVisible.value = false;
    await loadSays();
  } catch (e: any) {
    showToast(e.message || "操作失败", "error");
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(id: number) {
  if (!confirm(t("says.confirmDelete"))) return;
  try {
    await deleteSay(id);
    showToast("删除成功");
    await loadSays();
  } catch (e: any) {
    showToast(e.message || "删除失败", "error");
  }
}

onMounted(() => {
  fetchFeatureSettings()
    .then((res) => {
      initEmojiPacks(window.location.origin, res.emojiPaths).catch(() => {});
    })
    .catch(() => {
      initEmojiPacks(window.location.origin).catch(() => {});
    });
  loadSays(1);
});

watch(currentSiteId, () => { page.value = 1; loadSays(1); });
</script>

<style scoped lang="less">
@import "../../styles/components/comments.less";

/* Says-specific column widths */
.table-cell-content { flex-direction: column; flex: 1; align-items: flex-start !important; justify-content: center; min-width: 200px; }
.table-cell-tags { width: 150px; flex-shrink: 0; }
.table-cell-time { width: 140px; flex-shrink: 0; }
.table-cell-status { width: 90px; flex-shrink: 0; }
.table-cell-actions { width: 230px; flex-shrink: 0; }

.cell-content-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  word-wrap: break-word;
  max-height: 120px;
  overflow-y: auto;
}
.cell-content-text :deep(p) { margin: 0 0 8px; }
.cell-content-text :deep(p:last-child) { margin-bottom: 0; }
.cell-content-text :deep(img) { max-width: 100%; height: auto; border-radius: 8px; }
.cell-content-text :deep(pre) { padding: 12px; overflow-x: auto; background: var(--bg-secondary); border-radius: 6px; font-size: 0.9em; }
.cell-content-text :deep(code) { font-family: ui-monospace, monospace; background: var(--bg-secondary); padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
.cell-content-text :deep(pre code) { padding: 0; background: transparent; }
.cell-content-text :deep(a) { color: var(--primary-color); text-decoration: none; }
.cell-content-text :deep(blockquote) { margin: 8px 0; padding: 0 12px; border-left: 4px solid var(--border-light); color: var(--text-secondary); }
.cell-content-text :deep(ul), .cell-content-text :deep(ol) { padding-left: 1.7em; margin: 0 0 8px; }

.cell-tags-wrapper { display: flex; flex-wrap: wrap; gap: 4px; }
.cell-tag {
  padding: 2px 8px;
  background-color: var(--bg-hover);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-secondary);
}
.cell-time-text { font-size: 12px; color: var(--text-tertiary); white-space: nowrap; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background-color: rgba(0,0,0,0.25); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.modal {
  background: var(--bg-card-solid); border-radius: var(--radius-lg); max-width: 600px; width: 90%;
  max-height: 80vh; overflow-y: auto; padding: 24px; box-shadow: var(--shadow-popover);
  display: flex; flex-direction: column; gap: 16px;
}
.modal-title { margin: 0; font-size: 17px; font-weight: 600; }
.modal-body { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
.form-input {
  width: 100%; padding: 8px 12px; font-size: 14px; line-height: 1.5; color: var(--text-primary);
  background: var(--bg-input); border: 1px solid var(--border-light); border-radius: var(--radius-sm);
  font-family: inherit;
}
.form-input:focus { outline: none; border-color: var(--primary-color); }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.modal-btn {
  padding: 8px 18px; border-radius: var(--radius-sm); border: none; font-size: 14px; font-weight: 500; cursor: pointer;
}
.modal-btn.primary { background: var(--primary-color); color: var(--text-inverse); }
.modal-btn.primary:hover { background: var(--primary-hover); }
.modal-btn.secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-light); }
.modal-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Toast */
.toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  padding: 10px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 500;
  z-index: 3000; box-shadow: var(--shadow-card);
}
.toast-success { background: var(--color-success); color: #fff; }
.toast-error { background: var(--color-danger); color: #fff; }
</style>
