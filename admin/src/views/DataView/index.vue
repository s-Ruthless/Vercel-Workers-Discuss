<template>
  <div class="page">
    <h2 class="page-title">{{ t("data.title") }}</h2>
    <div v-if="toastVisible" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-success'">
      {{ toastMessage }}
    </div>

    <!-- 1. 评论数据 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.comments.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.comments.desc") }}</p>
      <div class="action-row">
        <span class="action-label">{{ t("data.sections.comments.exportLabel") }}</span>
        <button class="card-button secondary" :disabled="exporting" @click="handleExportComments">
          <span v-if="exporting">{{ t("data.sections.comments.exporting") }}</span>
          <span v-else>{{ t("data.sections.comments.exportJson") }}</span>
        </button>
      </div>
      <div class="action-row">
        <span class="action-label">{{ t("data.sections.comments.importLabel") }}</span>
        <select v-model="importSource" class="form-select" style="min-width: 120px">
          <option value="vwd">{{ t("data.sections.comments.source.cwd") }}</option>
          <option value="twikoo">{{ t("data.sections.comments.source.twikoo") }}</option>
          <option value="artalk">{{ t("data.sections.comments.source.artalk") }}</option>
          <option value="valine">{{ t("data.sections.comments.source.valine") }}</option>
        </select>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('comments')">
          {{ t("data.sections.comments.importButton") }}
        </button>
      </div>
    </div>

    <!-- 导入日志 -->
    <div v-if="importLogs.length > 0" class="log-container">
      <div class="log-title">{{ t("data.logs.title") }}</div>
      <div class="log-list">
        <div v-for="(log, index) in importLogs" :key="index" class="log-item">{{ log }}</div>
      </div>
    </div>

    <!-- 2. 系统配置 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.config.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.config.desc") }}</p>
      <div class="action-row">
        <button class="card-button secondary" :disabled="exporting" @click="handleExportConfig">{{ t("data.sections.config.export") }}</button>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('config')">{{ t("data.sections.config.import") }}</button>
      </div>
    </div>

    <!-- 3. 访问统计 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.stats.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.stats.desc") }}</p>
      <div class="action-row">
        <button class="card-button secondary" :disabled="exporting" @click="handleExportStats">{{ t("data.sections.stats.export") }}</button>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('stats')">{{ t("data.sections.stats.import") }}</button>
      </div>
    </div>

    <!-- 4. 全量备份 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.backup.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.backup.desc") }}</p>
      <div class="action-row">
        <button class="card-button secondary" :disabled="exporting" @click="handleExportBackup">{{ t("data.sections.backup.export") }}</button>
        <button class="card-button secondary" :disabled="importing" @click="triggerFileInput('backup')">{{ t("data.sections.backup.import") }}</button>
      </div>
    </div>

    <!-- 5. S3 备份 -->
    <div class="card">
      <h3 class="card-title">{{ t("data.sections.s3.title") }}</h3>
      <p class="card-desc">{{ t("data.sections.s3.desc") }}</p>
      <div class="form-group">
        <label class="form-label">{{ t("data.sections.s3.endpoint") }}</label>
        <input v-model="s3Config.endpoint" class="form-input" :placeholder="t('data.sections.s3.endpointHint')" />
      </div>
      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.bucket") }}</label>
          <input v-model="s3Config.bucket" class="form-input" />
        </div>
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.region") }}</label>
          <input v-model="s3Config.region" class="form-input" :placeholder="t('data.sections.s3.regionHint')" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.accessKey") }}</label>
          <input v-model="s3Config.accessKeyId" class="form-input" />
        </div>
        <div class="form-group half">
          <label class="form-label">{{ t("data.sections.s3.secretKey") }}</label>
          <input v-model="s3Config.secretAccessKey" class="form-input" />
        </div>
      </div>
      <div class="action-row" style="margin-top: 16px">
        <button class="card-button primary" :disabled="s3Saving" @click="handleSaveS3">{{ s3Saving ? t("data.sections.s3.saving") : t("data.sections.s3.save") }}</button>
        <button class="card-button secondary" :disabled="s3BackingUp" @click="handleS3Backup">{{ s3BackingUp ? t("data.sections.s3.backingUp") : t("data.sections.s3.backup") }}</button>
        <button class="card-button secondary" @click="handleViewS3Backups">{{ t("data.sections.s3.viewBackups") }}</button>
      </div>
    </div>

    <input type="file" ref="fileInput" accept=".json,.jsonl" style="display: none" @change="handleFileChange" />

    <div v-if="showSiteIdModal" class="modal-overlay">
      <div class="modal">
        <h3 class="modal-title">{{ t("data.siteIdModal.title") }}</h3>
        <p class="modal-desc">{{ t("data.siteIdModal.desc") }}</p>
        <div class="form-group">
          <label class="form-label">{{ t("data.siteIdModal.selectLabel") }}</label>
          <select v-model="selectedSiteId" class="form-select" style="width: 100%">
            <option value="default">{{ t("layout.defaultSite") }}</option>
            <option v-for="item in siteOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t("data.siteIdModal.customLabel") }}</label>
          <input v-model="customSiteId" class="form-input" :placeholder="t('data.siteIdModal.customPlaceholder')" />
        </div>
        <div class="modal-actions">
          <button class="modal-btn secondary" @click="cancelSiteId">{{ t("data.siteIdModal.cancel") }}</button>
          <button class="modal-btn primary" @click="confirmSiteId">{{ t("data.siteIdModal.confirm") }}</button>
        </div>
      </div>
    </div>

    <S3BackupModal :visible="showS3BackupModal" @close="handleS3BackupModalClose" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  exportComments, importComments, exportConfig, importConfig,
  exportStats, importStats, exportBackup, importBackup,
  fetchS3Settings, saveS3Settings, triggerS3Backup,
  type S3SettingsResponse, fetchSiteList,
} from "../../api/admin";
import S3BackupModal from "./components/S3BackupModal.vue";
import { useSite } from "../../composables/useSite";

const { t } = useI18n();

const exporting = ref(false);
const importing = ref(false);
const importSource = ref("vwd");
const fileInput = ref<HTMLInputElement | null>(null);
const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);
const importLogs = ref<string[]>([]);
const { currentSiteId } = useSite();

const currentImportMode = ref<string>("comments");
const showSiteIdModal = ref(false);
const siteOptions = ref<{ label: string; value: string }[]>([]);
const selectedSiteId = ref("");
const customSiteId = ref("");
const pendingJson = ref<any[]>([]);
const s3Config = ref<S3SettingsResponse>({ endpoint: "", accessKeyId: "", secretAccessKey: "", bucket: "", region: "auto" });
const s3Saving = ref(false);
const s3BackingUp = ref(false);
const showS3BackupModal = ref(false);

async function loadS3Config() {
  try { s3Config.value = await fetchS3Settings(); } catch {}
}

async function handleSaveS3() {
  s3Saving.value = true;
  try { await saveS3Settings(s3Config.value); showToast(t("common.saveSuccess")); }
  catch (e: any) { showToast(e.message || t("common.saveFailed"), "error"); }
  finally { s3Saving.value = false; }
}

async function handleS3Backup() {
  s3BackingUp.value = true;
  try { const res = await triggerS3Backup(); showToast(t("data.sections.s3.success", { file: res.file })); }
  catch (e: any) { showToast(e.message || t("data.messages.exportFailed"), "error"); }
  finally { s3BackingUp.value = false; }
}

function handleViewS3Backups() { showS3BackupModal.value = true; }
function handleS3BackupModalClose() { showS3BackupModal.value = false; }

onMounted(() => { loadS3Config(); loadSiteOptions(); });

async function loadSiteOptions() {
  try {
    const res = await fetchSiteList();
    const sites = Array.isArray(res.sites) ? res.sites : [];
    const unique = Array.from(new Set(sites));
    siteOptions.value = unique.filter((s) => s && s !== "default").map((s) => ({ label: s, value: s }));
    selectedSiteId.value = currentSiteId.value || "default";
  } catch { siteOptions.value = []; }
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg; toastType.value = type; toastVisible.value = true;
  window.setTimeout(() => { toastVisible.value = false; }, 2000);
}

function addLog(msg: string) {
  importLogs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

async function executeExport(apiFunc: () => Promise<any>, fileNamePrefix: string) {
  exporting.value = true;
  try {
    const data = await apiFunc();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileNamePrefix}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showToast(t("data.messages.exportSuccess"), "success");
  } catch (e: any) {
    showToast(e.message || t("data.messages.exportFailed"), "error");
  } finally {
    exporting.value = false;
  }
}

const handleExportComments = () => executeExport(exportComments, "comments-export");
const handleExportConfig = () => executeExport(exportConfig, "vwd-config");
const handleExportStats = () => executeExport(() => exportStats(currentSiteId.value), "vwd-stats");
const handleExportBackup = () => executeExport(exportBackup, "vwd-full-backup");

function triggerFileInput(mode: string) {
  currentImportMode.value = mode;
  importLogs.value = [];
  if (fileInput.value) { fileInput.value.value = ""; fileInput.value.click(); }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  importing.value = true;
  addLog(t("data.messages.importStart", { name: file.name, mode: currentImportMode.value }));
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      let json;
      if (currentImportMode.value === "comments" && importSource.value === "valine") {
        json = parseNDJSON(content);
        addLog(t("data.messages.fileParseSuccess"));
      } else {
        try { json = JSON.parse(content); }
        catch { throw new Error(t("data.messages.jsonParseFailed")); }
        addLog(t("data.messages.fileParseSuccess"));
      }
      switch (currentImportMode.value) {
        case "comments": await processImportComments(json); break;
        case "config": await processImportConfig(json); break;
        case "stats": await processImportStats(json); break;
        case "backup": await processImportBackup(json); break;
      }
    } catch (err: any) {
      addLog(t("data.messages.errorWithMessage", { msg: err.message }));
      showToast(err.message, "error");
      importing.value = false;
    }
  };
  reader.onerror = () => { addLog(t("data.messages.readFileFailedLog")); showToast(t("data.messages.fileReadFailed"), "error"); importing.value = false; };
  reader.readAsText(file);
}

function parseNDJSON(content: string): any[] {
  const lines = content.split("\n");
  const results: any[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#filetype:")) continue;
    try { results.push(JSON.parse(line)); } catch {}
  }
  return results;
}

async function processImportConfig(data: any) {
  const res = await importConfig(data);
  addLog(res.message);
  showToast(t("data.messages.importConfigSuccess"));
  importing.value = false;
}

async function processImportStats(data: any) {
  const res = await importStats(data);
  addLog(res.message);
  showToast(t("data.messages.importStatsSuccess"));
  importing.value = false;
}

async function processImportBackup(data: any) {
  const res = await importBackup(data);
  addLog(res.message);
  showToast(t("data.messages.importBackupSuccess"));
  importing.value = false;
}

async function processImportComments(json: any) {
  const comments = Array.isArray(json) ? json : [json];
  addLog(t("data.messages.parsedCommentsCount", { count: comments.length }));
  pendingJson.value = comments;
  selectedSiteId.value = currentSiteId.value || "default";
  customSiteId.value = "";
  showSiteIdModal.value = true;
}

async function executeImportComments(comments: any[], siteId?: string) {
  try {
    const commentsWithSiteId = comments.map((item) => ({ ...item, site_id: siteId || currentSiteId.value || "default" }));
    const res = await importComments(commentsWithSiteId);
    addLog(t("data.messages.importCommentsDone", { message: res.message }));
    showToast(t("data.messages.importCommentsSuccess"));
  } catch (err: any) { throw err; }
  finally { importing.value = false; pendingJson.value = []; }
}

async function confirmSiteId() {
  const siteId = customSiteId.value.trim() || selectedSiteId.value || "default";
  addLog(t("data.messages.siteIdSelected", { siteId }));
  showSiteIdModal.value = false;
  await executeImportComments(pendingJson.value, siteId);
}

function cancelSiteId() {
  showSiteIdModal.value = false;
  addLog(t("data.messages.importCancelled"));
  importing.value = false;
  pendingJson.value = [];
}
</script>

<style scoped lang="less">
@import "../../styles/components/data.less";

.form-row { display: flex; gap: 12px; margin-top: 12px; }
.form-group { margin-top: 12px; }
.form-group.half { flex: 1; margin-top: 0; }
.form-label { display: block; font-size: 13px; margin-bottom: 4px; color: var(--text-primary); }
</style>
