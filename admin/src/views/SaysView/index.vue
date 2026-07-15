<template>
  <div class="page">
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
      <h2 class="page-title">{{ t("says.title") }}</h2>
      <button class="card-button primary" @click="openCreateModal" type="button">{{ t("says.createBtn") }}</button>
    </div>
    <div v-if="toastVisible" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-success'">{{ toastMessage }}</div>
    <div v-if="loading" class="page-hint">{{ t("common.loading") }}</div>
    <div v-else-if="says.length === 0" class="page-hint">{{ t("says.empty") }}</div>
    <div v-else class="says-list">
      <div v-for="item in says" :key="item.id" class="say-card">
        <div class="say-content" v-html="item.contentHtml"></div>
        <div class="say-footer">
          <span class="say-status-tag" :class="'say-status-' + item.status">{{ statusLabel(item.status) }}</span>
          <div v-if="item.tags && item.tags.length" class="say-tags">
            <span v-for="tag in item.tags" :key="tag" class="say-tag">{{ tag }}</span>
          </div>
          <span class="say-time">{{ formatTime(item.created) }}</span>
          <span class="say-likes">👍 {{ item.likes }}</span>
          <div class="say-actions">
            <button v-if="item.status !== 'published'" class="card-button small primary" @click="changeStatus(item.id, 'published')" type="button">{{ t("says.actions.publish") }}</button>
            <button v-if="item.status !== 'draft'" class="card-button small secondary" @click="changeStatus(item.id, 'draft')" type="button">{{ t("says.actions.draft") }}</button>
            <button v-if="item.status !== 'hidden'" class="card-button small secondary" @click="changeStatus(item.id, 'hidden')" type="button">{{ t("says.actions.hide") }}</button>
            <button class="card-button small secondary" @click="openEditModal(item)" type="button">{{ t("says.edit") }}</button>
            <button class="card-button small danger" @click="handleDelete(item.id)" type="button">{{ t("says.delete") }}</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="totalPages > 1" class="pagination">
      <button class="card-button small secondary" :disabled="page <= 1" @click="goPage(page - 1)" type="button">上一页</button>
      <span class="page-info">{{ page }} / {{ totalPages }}</span>
      <button class="card-button small secondary" :disabled="page >= totalPages" @click="goPage(page + 1)" type="button">下一页</button>
    </div>

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
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { fetchSays, createSay, updateSay, deleteSay, updateSayStatus, type SayItem } from "../../api/admin";
import { useSite } from "../../composables/useSite";

const { t } = useI18n();
const { currentSiteId } = useSite();

const loading = ref(false);
const says = ref<SayItem[]>([]);
const page = ref(1);
const totalPages = ref(1);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);
const submitting = ref(false);

const modalVisible = ref(false);
const editingId = ref<number | null>(null);
const modalContent = ref("");
const modalTags = ref("");
const modalStatus = ref("published");

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg; toastType.value = type; toastVisible.value = true;
  window.setTimeout(() => { toastVisible.value = false; }, 2000);
}

function statusLabel(status: string): string {
  if (status === "published") return t("says.statusPublished");
  if (status === "draft") return t("says.statusDraft");
  return t("says.statusHidden");
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function loadSays() {
  loading.value = true;
  try {
    const res = await fetchSays(page.value, currentSiteId.value);
    says.value = res.data;
    totalPages.value = res.pagination.total;
  } catch (e: any) {
    showToast(e.message || "加载失败", "error");
  } finally {
    loading.value = false;
  }
}

function goPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
    loadSays();
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

async function changeStatus(id: number, status: string) {
  try {
    await updateSayStatus(id, status);
    showToast("状态更新成功");
    await loadSays();
  } catch (e: any) {
    showToast(e.message || "更新失败", "error");
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

onMounted(() => { loadSays(); });
watch(currentSiteId, () => { page.value = 1; loadSays(); });
</script>

<style scoped lang="less">
.says-list { display: flex; flex-direction: column; gap: 16px; }
.say-card {
  background: var(--bg-card-solid);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.say-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  word-wrap: break-word;
}
.say-content :deep(p) { margin: 0 0 8px; }
.say-content :deep(p:last-child) { margin-bottom: 0; }
.say-content :deep(img) { max-width: 100%; height: auto; border-radius: 8px; }
.say-content :deep(pre) { padding: 12px; overflow-x: auto; background: var(--bg-secondary); border-radius: 6px; font-size: 0.9em; }
.say-content :deep(code) { font-family: ui-monospace, monospace; background: var(--bg-secondary); padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
.say-content :deep(pre code) { padding: 0; background: transparent; }
.say-content :deep(a) { color: var(--primary-color); text-decoration: none; }
.say-content :deep(a:hover) { text-decoration: underline; }
.say-content :deep(blockquote) { margin: 8px 0; padding: 0 12px; border-left: 4px solid var(--border-light); color: var(--text-secondary); }
.say-content :deep(ul), .say-content :deep(ol) { padding-left: 1.7em; margin: 0 0 8px; }
.say-content :deep(h1), .say-content :deep(h2), .say-content :deep(h3) { margin-top: 16px; margin-bottom: 8px; font-weight: 600; }

.say-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 13px;
  color: var(--text-secondary);
}
.say-status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}
.say-status-published { background: #dafbe1; color: #1a7f37; }
.say-status-draft { background: #fff8c5; color: #9a6700; }
.say-status-hidden { background: #f6f8fa; color: #6e7781; }
.say-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.say-tag {
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
.say-time { white-space: nowrap; }
.say-likes { white-space: nowrap; }
.say-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-left: auto; }

.card-button {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.card-button.primary { background: var(--primary-color); color: var(--text-inverse); }
.card-button.primary:hover { background: var(--primary-hover); }
.card-button.secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-light); }
.card-button.secondary:hover { background: var(--bg-hover); }
.card-button.small { padding: 4px 10px; font-size: 12px; }
.card-button.danger { background: #feebe9; color: #cf222e; }
.card-button.danger:hover { background: #fd8c73; color: #fff; }
.card-button:disabled { opacity: 0.6; cursor: not-allowed; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 20px 0; }
.page-info { font-size: 13px; color: var(--text-secondary); }
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
</style>
