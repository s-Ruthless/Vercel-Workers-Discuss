<template>
  <div class="layout">
    <header class="layout-header">
      <button
        class="layout-menu-toggle"
        @click="toggleSider"
        :aria-label="t('layout.toggleMenu')"
        type="button"
      >
        <PhTextIndent :size="20" />
      </button>
      <div class="layout-title">{{ layoutTitle }}</div>
      <div class="layout-actions-wrapper">
        <div v-if="allSiteOptions.length > 0" class="site-switcher">
          <button class="layout-button site-switcher-btn" @click="toggleSiteDropdown" type="button">
            <PhGlobe :size="15" />
            <span class="site-switcher-label">{{ currentSiteLabel }}</span>
            <PhCaretDown :size="12" weight="bold" />
          </button>
          <div v-if="isSiteDropdownOpen" class="site-switcher-dropdown">
            <div
              v-for="site in allSiteOptions"
              :key="site.value"
              class="site-switcher-item"
              :class="{ active: site.value === currentSiteId }"
              @click="selectSite(site.value)"
            >
              <PhCheck v-if="site.value === currentSiteId" :size="14" weight="bold" class="site-switcher-check" />
              <span v-else class="site-switcher-check-placeholder"></span>
              <span class="site-switcher-item-name">{{ site.label }}</span>
            </div>
          </div>
        </div>
        <div class="layout-actions">
          <a class="layout-button" href="https://github.com/s-Ruthless/Vercel-Workers-Discuss" target="_blank">
            Github
          </a>
          <button class="layout-button" @click="toggleAccent" title="主题色" type="button">
            <PhPalette :size="16" />
          </button>
          <button class="layout-button" @click="cycleTheme" :title="themeTitle" type="button">
            <PhSun v-if="theme === 'light'" :size="16" />
            <PhMoon v-else-if="theme === 'dark'" :size="16" />
            <PhAirplay v-else :size="16" />
          </button>
          <div v-if="isAccentOpen" class="accent-dropdown">
            <div class="accent-dropdown-title">主题色</div>
            <div class="accent-swatches">
              <button
                v-for="preset in accentPresets"
                :key="preset.color"
                class="accent-swatch"
                :class="{ 'accent-swatch-active': accentColor === preset.color }"
                :style="{ background: preset.color }"
                :title="preset.name"
                @click="selectAccent(preset.color)"
                type="button"
              />
            </div>
            <div class="accent-custom">
              <label class="accent-custom-label">自定义</label>
              <input type="color" :value="accentColor" @input="setAccent(($event.target as HTMLInputElement).value)" class="accent-color-input" />
            </div>
            <button class="accent-reset" @click="selectAccent('#007aff')" type="button">重置默认</button>
          </div>
          <button class="layout-button" @click="handleLogout">
            {{ t("layout.logout") }}
          </button>
        </div>
        <button
          class="layout-actions-toggle"
          @click="toggleActions"
          :aria-label="t('layout.moreActions')"
          type="button"
        >
          <PhDotsThreeVertical :size="20" bold />
        </button>
        <div v-if="isActionsOpen" class="layout-actions-dropdown">
          <template v-if="allSiteOptions.length > 0">
            <div class="layout-actions-section-label">站点</div>
            <button
              v-for="site in allSiteOptions"
              :key="site.value"
              class="layout-actions-item"
              :class="{ 'layout-actions-item-active': site.value === currentSiteId }"
              type="button"
              @click="selectSite(site.value); closeActions();"
            >
              {{ site.label }}
            </button>
            <div class="layout-actions-divider"></div>
          </template>
          <button class="layout-actions-item" type="button" @click="openGithub">
            Github
          </button>
          <button
            class="layout-actions-item layout-actions-item-danger"
            type="button"
            @click="handleLogoutFromActions"
          >
            {{ t("layout.logout") }}
          </button>
        </div>
      </div>
    </header>
    <div class="layout-body">
      <nav class="layout-sider" :class="{ 'layout-sider-mobile-open': isMobileSiderOpen }">
        <ul class="menu">
          <li class="menu-item" :class="{ active: isRouteActive('stats') }" @click="goStats">
            <PhSquaresFour class="menu-item-icon" :size="18" />
            <span>{{ t("menu.stats") }}</span>
          </li>
          <li class="menu-item" :class="{ active: isRouteActive('comments') }" @click="goComments">
            <PhChatCircleDots class="menu-item-icon" :size="18" />
            <span>{{ t("menu.comments") }}</span>
          </li>
          <li class="menu-item" :class="{ active: isRouteActive('says') }" @click="goSays">
            <PhPenNib class="menu-item-icon" :size="18" />
            <span>{{ t("menu.says") }}</span>
          </li>
          <li class="menu-item" :class="{ active: isRouteActive('settings') }" @click="goSettings">
            <PhGear class="menu-item-icon" :size="18" />
            <span>{{ t("menu.settings") }}</span>
          </li>
          <li class="menu-item" :class="{ active: isRouteActive('data') }" @click="goData">
            <PhDatabase class="menu-item-icon" :size="18" />
            <span>{{ t("menu.data") }}</span>
          </li>
          <li class="menu-item" :class="{ active: isRouteActive('sites') }" @click="goSites">
            <PhGlobe class="menu-item-icon" :size="18" />
            <span>{{ t("menu.sites") }}</span>
          </li>
        </ul>
        <div class="layout-sider-footer" @click="openVersionModal">
          <div class="layout-sider-footer-line">
            <span>API {{ apiVersion }}</span>
          </div>
          <div class="layout-sider-footer-line">Admin {{ adminVersion }}</div>
        </div>
      </nav>
      <div v-if="isMobileSiderOpen" class="layout-sider-mask" @click="closeSider" />
      <main class="layout-content">
        <router-view />
      </main>
    </div>
    <div v-if="versionModalVisible" class="modal-overlay" @click.self="closeVersionModal">
      <div class="modal">
        <h3 class="modal-title">{{ t("layout.version.title") }}</h3>
        <div class="modal-body">
          <p class="modal-row">
            <span class="modal-label">{{ t("layout.version.apiAddress") }}</span>
            <span class="modal-value">{{ checkedApiBaseUrl || t("layout.version.notConfigured") }}</span>
          </p>
          <p class="modal-row">
            <span class="modal-label">{{ t("layout.version.apiVersion") }}</span>
            <span class="modal-value">
              {{ apiVersion || (apiVersionError ? t("layout.version.notFetched") : t("layout.version.loading")) }}
            </span>
          </p>
          <p class="modal-row">
            <span class="modal-label">{{ t("layout.version.adminVersion") }}</span>
            <span class="modal-value">{{ adminVersion }}</span>
          </p>
          <p v-if="apiVersion && apiVersion === adminVersion" class="modal-status">
            {{ t("layout.version.match") }}
          </p>
          <p v-else-if="apiVersion && apiVersion !== adminVersion" class="modal-status">
            {{ t("layout.version.mismatch") }}
          </p>
          <p v-else-if="apiVersionError" class="modal-status">
            {{ t("layout.version.fetchError") }} {{ apiVersionError }}
          </p>
        </div>
        <div class="modal-actions">
          <button class="modal-btn" type="button" @click="closeVersionModal">
            {{ t("layout.version.ok") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { logoutAdmin, fetchAdminDisplaySettings, fetchManagedSites, type ManagedSite } from "../../api/admin";
import { useTheme } from "../../composables/useTheme";
import { useAccentColor, ACCENT_PRESETS } from "../../composables/useAccentColor";
import { useSite } from "../../composables/useSite";

const SITE_TITLE_KEY = "vwd_admin_site_title";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { theme, setTheme } = useTheme();
const { accentColor, setAccent, initAccent } = useAccentColor();
const { currentSiteId } = useSite();

const isMobileSiderOpen = ref(false);
const isActionsOpen = ref(false);
const isAccentOpen = ref(false);
const adminVersion = ref("0.2.0");
const apiVersion = ref("");
const checkedApiBaseUrl = ref("");
const apiVersionError = ref("");
const versionModalVisible = ref(false);
const layoutTitle = ref(localStorage.getItem(SITE_TITLE_KEY) || "VWD 评论系统");

const themeTitle = computed(() => {
  if (theme.value === "light") return t("layout.theme.light");
  if (theme.value === "dark") return t("layout.theme.dark");
  return t("layout.theme.system");
});

const accentPresets = ACCENT_PRESETS;

function cycleTheme() {
  if (theme.value === "system") setTheme("light");
  else if (theme.value === "light") setTheme("dark");
  else setTheme("system");
}
function toggleAccent() { isAccentOpen.value = !isAccentOpen.value; }
function closeAccent() { isAccentOpen.value = false; }
function selectAccent(color: string) { setAccent(color); closeAccent(); }

function closeDropdownsOnOutside(e: MouseEvent) {
  const el = e.target as HTMLElement;
  if (!el.closest(".accent-dropdown") && !el.closest("[title=\"主题色\"]")) {
    isAccentOpen.value = false;
  }
  if (!el.closest(".site-switcher-dropdown") && !el.closest(".site-switcher-btn")) {
    isSiteDropdownOpen.value = false;
  }
}

const defaultSiteId = "blog";
const managedSites = ref<ManagedSite[]>([]);
const isSiteDropdownOpen = ref(false);

const allSiteOptions = computed(() => {
  return managedSites.value.map(s => ({
    label: s.name || s.siteId,
    value: s.siteId,
    isDefault: s.isDefault || s.siteId === 'blog',
  }));
});

const currentSiteLabel = computed(() => {
  const site = managedSites.value.find(s => s.siteId === currentSiteId.value);
  return site ? site.name : currentSiteId.value || defaultSiteId;
});

function toggleSiteDropdown() {
  isSiteDropdownOpen.value = !isSiteDropdownOpen.value;
  isAccentOpen.value = false;
}

function selectSite(value: string) {
  currentSiteId.value = value;
  isSiteDropdownOpen.value = false;
}

async function loadSites() {
  try {
    const managedRes = await fetchManagedSites().catch(() => ({ sites: [] as ManagedSite[] }));
    managedSites.value = managedRes.sites || [];
  } catch {
    managedSites.value = [];
  }
}

async function loadVersion() {
  checkedApiBaseUrl.value = window.location.origin;
  apiVersionError.value = "";
  try {
    const res = await fetch(window.location.origin);
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) {
      apiVersionError.value = "当前 API 版本较旧，未提供版本信息接口。";
      return;
    }
    const data = await res.json().catch(() => null);
    if (data && typeof data.version === "string") {
      apiVersion.value = data.version;
    } else {
      apiVersionError.value = "当前 API 版本较旧，未提供版本信息接口。";
    }
  } catch (e) {
    apiVersionError.value = (e as Error).message || "获取接口版本失败";
  }
}

function updateTitle(newTitle: string) {
  layoutTitle.value = newTitle;
  localStorage.setItem(SITE_TITLE_KEY, newTitle);
  const pageTitle = route.meta.title;
  if (pageTitle) {
    document.title = `${pageTitle} - ${newTitle}`;
  } else {
    document.title = newTitle;
  }
}

async function loadDisplaySettings() {
  try {
    const res = await fetchAdminDisplaySettings();
    const title = res.layoutTitle || "VWD 评论系统";
    updateTitle(title);
  } catch {
    // keep default
  }
}

provide("updateSiteTitle", updateTitle);
provide("reloadSites", loadSites);
provide("managedSites", managedSites);

watch(managedSites, (sites) => {
  if (sites.length > 0 && !sites.some(s => s.siteId === currentSiteId.value)) {
    currentSiteId.value = sites[0].siteId;
  }
});

onMounted(() => {
  initAccent();
  loadSites();
  loadVersion();
  loadDisplaySettings();
  document.addEventListener("click", closeDropdownsOnOutside);
});

function isRouteActive(name: string) {
  return route.name === name;
}

function closeSider() { isMobileSiderOpen.value = false; }
function toggleSider() { isMobileSiderOpen.value = !isMobileSiderOpen.value; }
function toggleActions() { isActionsOpen.value = !isActionsOpen.value; }
function closeActions() { isActionsOpen.value = false; }

function goComments() { router.push({ name: "comments" }); closeSider(); }
function goStats() { router.push({ name: "stats" }); closeSider(); }
function goSays() { router.push({ name: "says" }); closeSider(); }
function goData() { router.push({ name: "data" }); closeSider(); }
function goSettings() { router.push({ name: "settings" }); closeSider(); }
function goSites() { router.push({ name: "sites" }); closeSider(); }

function openGithub() { window.open("https://github.com/s-Ruthless/Vercel-Workers-Discuss", "_blank"); closeActions(); }

function handleLogout() { logoutAdmin(); router.push({ name: "login" }); closeSider(); }
function handleLogoutFromActions() { closeActions(); handleLogout(); }

function openVersionModal() { loadVersion(); versionModalVisible.value = true; }
function closeVersionModal() { versionModalVisible.value = false; }
</script>

<style lang="less">
@import "../../styles/layout.less";
.modal-overlay {
  position: fixed; inset: 0;
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
  animation: modal-fade-in 0.2s ease;
}
@keyframes modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal {
  background-color: var(--bg-card-solid); border-radius: var(--radius-lg); max-width: 440px; width: 100%;
  margin: 10px; padding: 24px; box-shadow: var(--shadow-popover);
  display: flex; flex-direction: column; gap: 16px;
  animation: modal-scale-in 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes modal-scale-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-title { margin: 0; font-size: 17px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.modal-body { display: flex; flex-direction: column; gap: 10px; font-size: 14px; color: var(--text-secondary); }
.modal-row { margin: 0; display: flex; justify-content: space-between; gap: 10px; }
.modal-label { flex: 0 0 auto; font-weight: 500; }
.modal-value { flex: 1 1 auto; text-align: right; word-break: break-all; color: var(--text-primary); }
.modal-status { margin: 6px 0 0; font-size: 14px; color: var(--text-primary); font-weight: 500; }
.modal-actions { display: flex; justify-content: flex-end; margin-top: 6px; }
.modal-btn {
  padding: 8px 20px; border-radius: var(--radius-sm); border: none; font-size: 14px; font-weight: 500; cursor: pointer;
  background-color: var(--primary-color); color: var(--text-inverse);
  transition: all var(--transition-fast);
}
.modal-btn:hover { background-color: var(--primary-hover); }
.modal-btn:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

/* Site switcher */
.site-switcher {
  position: relative;
}
.site-switcher-btn {
  gap: 5px;
}
.site-switcher-label {
  max-width: 120px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.site-switcher-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: var(--bg-card-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-popover);
  padding: 6px;
  z-index: 1000;
  min-width: 180px;
  animation: modal-scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.site-switcher-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}
.site-switcher-item:hover {
  background: var(--bg-hover);
}
.site-switcher-item.active {
  color: var(--primary-color);
  font-weight: 600;
}
.site-switcher-check {
  flex: 0 0 14px;
}
.site-switcher-check-placeholder {
  flex: 0 0 14px;
}
.site-switcher-item-name {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.site-switcher-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-success);
  background-color: rgba(52, 199, 89, 0.12);
  border-radius: var(--radius-pill);
}

/* Accent color dropdown */
.accent-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: var(--bg-card-solid);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-popover);
  padding: 14px 16px;
  z-index: 1000;
  min-width: 200px;
  animation: modal-scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.accent-dropdown-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.accent-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.accent-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.accent-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.accent-swatch-active {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--bg-card-solid), 0 0 0 4px var(--text-primary);
}
.accent-custom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  margin-bottom: 8px;
  border-top: 1px solid var(--border-color);
}
.accent-custom-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}
.accent-color-input {
  width: 32px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
  padding: 2px;
}
.accent-color-input::-webkit-color-swatch-wrapper { padding: 0; }
.accent-color-input::-webkit-color-swatch { border: none; border-radius: 4px; }
.accent-color-input::-moz-color-swatch { border: none; border-radius: 4px; }

.accent-reset {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-card-solid);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.accent-reset:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
