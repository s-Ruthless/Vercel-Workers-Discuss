<template>
  <div class="page">
    <h2 class="page-title">{{ t("sites.title") }}</h2>
    <div class="toolbar">
      <div class="toolbar-left"></div>
      <div class="toolbar-right">
        <button class="toolbar-button" @click="openCreateModal">{{ t("sites.createBtn") }}</button>
        <button class="toolbar-button" @click="loadSites">&#8635;</button>
      </div>
    </div>
    <div v-if="loading" class="page-hint">{{ t("common.loading") }}</div>
    <div v-else-if="error" class="page-error">{{ error }}</div>
    <div v-else>
      <div class="comment-table">
        <div class="table-header">
          <div class="table-cell table-cell-name">{{ t("sites.table.name") }}</div>
          <div class="table-cell table-cell-siteid">{{ t("sites.table.siteId") }}</div>
          <div class="table-cell table-cell-url">{{ t("sites.table.url") }}</div>
          <div class="table-cell table-cell-actions">{{ t("sites.table.actions") }}</div>
        </div>
        <div v-for="item in sites" :key="item.id" class="table-row">
          <div class="table-cell table-cell-name">
            <span class="cell-name">{{ item.name }}</span>
            <span v-if="item.isDefault" class="cell-default-tag">默认</span>
          </div>
          <div class="table-cell table-cell-siteid">
            <span class="cell-siteid" @click="copySiteId(item.siteId)" :title="t('sites.copySiteId')">
              {{ item.siteId }}
            </span>
          </div>
          <div class="table-cell table-cell-url">
            <a v-if="item.url" :href="item.url" target="_blank" class="cell-url" :title="item.url">{{ item.url }}</a>
            <span v-else class="cell-url-empty">-</span>
          </div>
          <div class="table-cell table-cell-actions">
            <div class="table-actions">
              <button class="table-action" @click="openEditModal(item)">{{ t("sites.edit") }}</button>
              <button v-if="!item.isDefault" class="table-action table-action-danger" @click="handleDelete(item)">{{ t("sites.delete") }}</button>
            </div>
          </div>
        </div>
        <div v-if="sites.length === 0" class="table-empty">
          {{ t("sites.empty") }}
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastVisible" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-success'">{{ toastMessage }}</div>

    <!-- Create/Edit Modal -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingId ? t("sites.editTitle") : t("sites.createTitle") }}</h3>
          <button class="modal-close" @click="closeModal" type="button">&#10005;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ t("sites.field.name") }} *</label>
            <input v-model="modalName" class="form-input" :placeholder="t('sites.field.namePlaceholder')" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t("sites.field.siteId") }} *</label>
            <input v-model="modalSiteId" class="form-input" :placeholder="t('sites.field.siteIdPlaceholder')" :disabled="!!editingId" />
            <span class="form-hint">{{ t("sites.field.siteIdHint") }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t("sites.field.url") }}</label>
            <input v-model="modalUrl" class="form-input" :placeholder="t('sites.field.urlPlaceholder')" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="closeModal" type="button">{{ t("sites.cancel") }}</button>
          <button class="modal-btn primary" :disabled="submitting" @click="handleSubmit" type="button">
            <span v-if="submitting">{{ t("sites.submitting") }}</span>
            <span v-else>{{ t("sites.save") }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "../../styles/markdown.css";
import { ref, onMounted, inject } from "vue";
import { useI18n } from "vue-i18n";
import {
  fetchManagedSites,
  createManagedSiteApi,
  updateManagedSiteApi,
  deleteManagedSiteApi,
  type ManagedSite,
} from "../../api/admin";

const { t } = useI18n();
const reloadSites = inject<() => void>("reloadSites", () => {});

const loading = ref(false);
const error = ref("");
const sites = ref<ManagedSite[]>([]);

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);
const submitting = ref(false);

const modalVisible = ref(false);
const editingId = ref<string | null>(null);
const modalName = ref("");
const modalSiteId = ref("");
const modalUrl = ref("");

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg; toastType.value = type; toastVisible.value = true;
  window.setTimeout(() => { toastVisible.value = false; }, 2000);
}

async function loadSites() {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetchManagedSites();
    sites.value = res.sites || [];
  } catch (e: any) {
    error.value = e.message || "加载失败";
  } finally {
    loading.value = false;
  }
}

function copySiteId(siteId: string) {
  navigator.clipboard?.writeText(siteId).then(() => {
    showToast(t("sites.copied"));
  }).catch(() => {});
}

function openCreateModal() {
  editingId.value = null;
  modalName.value = "";
  modalSiteId.value = "";
  modalUrl.value = "";
  modalVisible.value = true;
}

function openEditModal(item: ManagedSite) {
  editingId.value = item.id;
  modalName.value = item.name;
  modalSiteId.value = item.siteId;
  modalUrl.value = item.url;
  modalVisible.value = true;
}

function closeModal() {
  if (submitting.value) return;
  modalVisible.value = false;
}

async function handleSubmit() {
  const name = modalName.value.trim();
  const siteId = modalSiteId.value.trim();
  const url = modalUrl.value.trim();

  if (!name) { showToast(t("sites.validation.nameRequired"), "error"); return; }
  if (!siteId) { showToast(t("sites.validation.siteIdRequired"), "error"); return; }

  submitting.value = true;
  try {
    if (editingId.value) {
      await updateManagedSiteApi({ id: editingId.value, name, url, siteId });
      showToast(t("sites.updateSuccess"));
    } else {
      await createManagedSiteApi({ name, url, siteId });
      showToast(t("sites.createSuccess"));
    }
    modalVisible.value = false;
    await loadSites();
    reloadSites();
  } catch (e: any) {
    showToast(e.message || t("sites.operationFailed"), "error");
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(item: ManagedSite) {
  if (!confirm(t("sites.confirmDelete", { name: item.name }))) return;
  try {
    await deleteManagedSiteApi(item.id);
    showToast(t("sites.deleteSuccess"));
    await loadSites();
    reloadSites();
  } catch (e: any) {
    showToast(e.message || t("sites.operationFailed"), "error");
  }
}

onMounted(() => {
  loadSites();
});
</script>

<style scoped lang="less">
@import "../../styles/components/comments.less";

.table-cell-name { width: 200px; flex-shrink: 0; }
.table-cell-siteid { width: 200px; flex-shrink: 0; }
.table-cell-url { flex: 1; min-width: 200px; }
.table-cell-actions { width: 160px; flex-shrink: 0; }

.cell-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.cell-siteid {
  font-size: 13px; color: var(--text-link); cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  transition: opacity var(--transition-fast);
}
.cell-siteid:hover { text-decoration: underline; opacity: 0.85; }
.cell-url {
  font-size: 13px; color: var(--text-link); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; text-decoration: none;
  transition: opacity var(--transition-fast);
}
.cell-url:hover { text-decoration: underline; opacity: 0.85; }
.cell-url-empty { color: var(--text-tertiary); }
.cell-default-tag {
  display: inline-block; margin-left: 6px; padding: 1px 6px;
  font-size: 11px; font-weight: 600; color: var(--color-success);
  background-color: rgba(52, 199, 89, 0.12); border-radius: var(--radius-pill);
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background-color: rgba(0,0,0,0.25); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.modal {
  background: var(--bg-card-solid); border-radius: var(--radius-lg); max-width: 520px; width: 90%;
  max-height: 85vh; overflow-y: auto; padding: 0; box-shadow: var(--shadow-popover);
  display: flex; flex-direction: column;
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid var(--border-color);
}
.modal-title { margin: 0; font-size: 17px; font-weight: 600; color: var(--text-primary); }
.modal-close {
  width: 28px; height: 28px; border: none; background: transparent; cursor: pointer;
  font-size: 16px; color: var(--text-secondary); border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast);
}
.modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.form-hint { font-size: 12px; color: var(--text-tertiary); line-height: 1.4; }
.form-input {
  width: 100%; padding: 10px 14px; font-size: 14px; line-height: 1.5; color: var(--text-primary);
  background: var(--bg-input); border: 1px solid var(--border-input); border-radius: var(--radius-sm);
  font-family: inherit; transition: all var(--transition-fast); box-sizing: border-box;
}
.form-input:focus { outline: none; border-color: var(--primary-color); box-shadow: var(--shadow-focus); }
.form-input:disabled { opacity: 0.6; cursor: not-allowed; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid var(--border-color); }
.modal-btn {
  padding: 8px 20px; border-radius: var(--radius-sm); border: none; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: all var(--transition-fast);
}
.modal-btn.primary { background: var(--primary-color); color: var(--text-inverse); }
.modal-btn.primary:hover { background: var(--primary-hover); }
.modal-btn.secondary { background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); }
.modal-btn.secondary:hover { background: var(--bg-hover); }
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
