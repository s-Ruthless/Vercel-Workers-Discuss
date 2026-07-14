<template>
  <div class="page">
    <div style="display: flex; align-items: center; gap: 20px">
      <h2 class="page-title">{{ t("analytics.title") }}</h2>
    </div>
    <div v-if="toastVisible" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-success'">
      {{ toastMessage }}
    </div>
    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">{{ t("analytics.overview") }}</h3>
      </div>
      <div v-if="loading" class="page-hint">{{ t("common.loading") }}</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else>
        <div class="stats-grid">
          <div class="stats-item">
            <div class="stats-label">{{ t("analytics.totalPv") }}</div>
            <div class="stats-value"><CountTo :end-val="overview.totalPv" /></div>
          </div>
          <div class="stats-item">
            <div class="stats-label">{{ t("analytics.todayPv") }}</div>
            <div class="stats-value">
              <CountTo :end-val="overview.todayPv" />
              <span v-if="overview.yesterdayPv !== undefined" class="trend" :class="percentageChange >= 0 ? 'up' : 'down'" :title="`对比昨日 ${percentageChange >= 0 ? '增加' : '减少'} ${Math.abs(percentageChange).toFixed(1)}%`">
                <span class="trend-arrow">{{ percentageChange >= 0 ? "↑" : "↓" }}</span>
                {{ Math.abs(percentageChange).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="stats-item">
            <div class="stats-label">{{ t("analytics.weekPv") }}</div>
            <div class="stats-value">
              <CountTo :end-val="overview.weekPv" />
              <span v-if="overview.lastWeekPv !== undefined" class="trend" :class="weekPercentageChange >= 0 ? 'up' : 'down'" :title="`对比上周 ${weekPercentageChange >= 0 ? '增加' : '减少'} ${Math.abs(weekPercentageChange).toFixed(1)}%`">
                <span class="trend-arrow">{{ weekPercentageChange >= 0 ? "↑" : "↓" }}</span>
                {{ Math.abs(weekPercentageChange).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="stats-item">
            <div class="stats-label">{{ t("analytics.monthPv") }}</div>
            <div class="stats-value">
              <CountTo :end-val="overview.monthPv" />
              <span v-if="overview.lastMonthPv !== undefined" class="trend" :class="monthPercentageChange >= 0 ? 'up' : 'down'" :title="`对比上月 ${monthPercentageChange >= 0 ? '增加' : '减少'} ${Math.abs(monthPercentageChange).toFixed(1)}%`">
                <span class="trend-arrow">{{ monthPercentageChange >= 0 ? "↑" : "↓" }}</span>
                {{ Math.abs(monthPercentageChange).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div class="stats-item">
            <div class="stats-label">{{ t("analytics.totalPages") }}</div>
            <div class="stats-value"><CountTo :end-val="overview.totalPages" /></div>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">{{ t("analytics.trend") }}</h3>
        <div class="visit-tabs">
          <button class="visit-tab" :class="{ 'visit-tab-active': chartRange === '7' }" type="button" @click="changeChartRange('7')">{{ t("analytics.last7Days") }}</button>
          <button class="visit-tab" :class="{ 'visit-tab-active': chartRange === '30' }" type="button" @click="changeChartRange('30')">{{ t("analytics.last30Days") }}</button>
        </div>
      </div>
      <div v-if="loading" class="page-hint">{{ t("common.loading") }}</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div class="chart-wrapper">
        <div ref="chartEl" class="chart"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">{{ t("analytics.pageDetail") }}</h3>
        <div class="visit-tabs">
          <button class="visit-tab" :class="{ 'visit-tab-active': visitTab === 'pv' }" type="button" @click="changeVisitTab('pv')">{{ t("analytics.sort.pv") }}</button>
          <button class="visit-tab" :class="{ 'visit-tab-active': visitTab === 'latest' }" type="button" @click="changeVisitTab('latest')">{{ t("analytics.sort.latest") }}</button>
        </div>
      </div>
      <div v-if="listLoading" class="page-hint">{{ t("common.loading") }}</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else-if="items.length === 0" class="page-hint">{{ t("analytics.noData") }}</div>
      <div v-else class="domain-table-wrapper">
        <div class="domain-table">
          <div class="domain-table-header">
            <div class="domain-cell domain-cell-title">{{ t("analytics.table.title") }}</div>
            <div class="domain-cell domain-cell-pv">{{ t("analytics.table.pv") }}</div>
            <div class="domain-cell domain-cell-time">{{ t("analytics.table.time") }}</div>
            <div class="domain-cell domain-cell-url">{{ t("analytics.table.url") }}</div>
          </div>
          <div v-for="(item, index) in items" :key="index" class="domain-table-row">
            <div class="domain-cell domain-cell-title">{{ item.postTitle || item.postSlug }}</div>
            <div class="domain-cell domain-cell-pv">{{ item.pv }}</div>
            <div class="domain-cell domain-cell-time">{{ formatTime(item.lastVisitAt) }}</div>
            <div class="domain-cell domain-cell-url">
              <a v-if="item.postUrl" :href="item.postUrl" target="_blank" rel="noreferrer">{{ item.postUrl }}</a>
              <span v-else>-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-title-row">
        <h3 class="card-title">{{ t("analytics.likeRank") }}</h3>
      </div>
      <div v-if="loading" class="page-hint">{{ t("common.loading") }}</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <div v-else-if="likeStatsItems.length === 0" class="page-hint">{{ t("analytics.noLikeData") }}</div>
      <div v-else class="domain-table-wrapper">
        <div class="domain-table">
          <div class="domain-table-header">
            <div class="domain-cell domain-cell-rank">{{ t("analytics.table.rank") }}</div>
            <div class="domain-cell domain-cell-title">{{ t("analytics.table.title") }}</div>
            <div class="domain-cell domain-cell-like">{{ t("analytics.table.like") }}</div>
            <div class="domain-cell domain-cell-url">{{ t("analytics.table.url") }}</div>
          </div>
          <div v-for="(item, index) in likeStatsItems" :key="index" class="domain-table-row">
            <div class="domain-cell domain-cell-rank">{{ index + 1 }}</div>
            <div class="domain-cell domain-cell-title">{{ item.pageTitle || item.pageSlug }}</div>
            <div class="domain-cell domain-cell-like">{{ item.likes }}</div>
            <div class="domain-cell domain-cell-url">
              <a v-if="item.pageSlug" :href="item.pageSlug" target="_blank" rel="noreferrer">{{ item.pageSlug }}</a>
              <span v-else>-</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import * as echarts from "echarts";
import CountTo from "../../components/CountTo.vue";
import {
  fetchVisitOverview,
  fetchVisitPages,
  type VisitOverviewResponse,
  type VisitPageItem,
  fetchLikeStats,
  type LikeStatsItem,
} from "../../api/admin";
import { useSite } from "../../composables/useSite";

const { t } = useI18n();

const loading = ref(false);
const listLoading = ref(false);
const error = ref("");
const overview = ref<VisitOverviewResponse>({
  totalPv: 0, totalPages: 0, todayPv: 0, yesterdayPv: 0,
  weekPv: 0, lastWeekPv: 0, monthPv: 0, lastMonthPv: 0, last30Days: [],
});

const { currentSiteId } = useSite();

function calculateChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const percentageChange = computed(() => calculateChange(overview.value.todayPv, overview.value.yesterdayPv || 0));
const weekPercentageChange = computed(() => calculateChange(overview.value.weekPv, overview.value.lastWeekPv || 0));
const monthPercentageChange = computed(() => calculateChange(overview.value.monthPv, overview.value.lastMonthPv || 0));

const itemsByPv = ref<VisitPageItem[]>([]);
const itemsByLatest = ref<VisitPageItem[]>([]);
const visitTab = ref<"pv" | "latest">("pv");
const visitTabStorageKey = "vwd-analytics-visit-tab";
const chartRangeStorageKey = "vwd-analytics-visit-chart-range";

const items = computed<VisitPageItem[]>(() => {
  return visitTab.value === "latest" ? itemsByLatest.value : itemsByPv.value;
});

const last30Days = ref<{ date: string; total: number }[]>([]);
const likeStatsItems = ref<LikeStatsItem[]>([]);
const chartRange = ref<"7" | "30">("7");

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

const chartEl = ref<HTMLDivElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg; toastType.value = type; toastVisible.value = true;
  window.setTimeout(() => { toastVisible.value = false; }, 2000);
}

function formatTime(value: string | number | null | undefined): string {
  if (!value) return "-";
  let date: Date;
  if (typeof value === "number") date = new Date(value);
  else {
    const trimmed = value.trim();
    if (!trimmed) return "-";
    if (/^\d+$/.test(trimmed)) date = new Date(Number(trimmed));
    else date = new Date(trimmed);
  }
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${mm}`;
}

function getVisitOrderParam(): "pv" | "latest" {
  return visitTab.value === "latest" ? "latest" : "pv";
}

function loadVisitTabFromStorage() {
  try {
    const value = window.localStorage.getItem(visitTabStorageKey);
    if (value === "pv" || value === "latest") visitTab.value = value;
  } catch {}
}

function saveVisitTabToStorage(value: "pv" | "latest") {
  try { window.localStorage.setItem(visitTabStorageKey, value); } catch {}
}

function loadChartRangeFromStorage() {
  try {
    const value = window.localStorage.getItem(chartRangeStorageKey);
    if (value === "7" || value === "30") chartRange.value = value;
  } catch {}
}

function saveChartRangeToStorage(value: "7" | "30") {
  try { window.localStorage.setItem(chartRangeStorageKey, value); } catch {}
}

function getLastVisitAtTs(value: number | null | undefined): number {
  if (!value || typeof value !== "number" || Number.isNaN(value)) return 0;
  return value;
}

async function loadData() {
  loading.value = true;
  listLoading.value = true;
  error.value = "";
  try {
    const domain = currentSiteId.value;
    const order = getVisitOrderParam();
    const [overviewRes, pagesRes, likeStatsRes] = await Promise.all([
      fetchVisitOverview(domain),
      fetchVisitPages(domain, order),
      fetchLikeStats(domain),
    ]);
    overview.value = {
      totalPv: overviewRes.totalPv, totalPages: overviewRes.totalPages,
      todayPv: overviewRes.todayPv ?? 0, yesterdayPv: overviewRes.yesterdayPv ?? 0,
      weekPv: overviewRes.weekPv ?? 0, lastWeekPv: overviewRes.lastWeekPv ?? 0,
      monthPv: overviewRes.monthPv ?? 0, lastMonthPv: overviewRes.lastMonthPv ?? 0,
      last30Days: Array.isArray(overviewRes.last30Days) ? overviewRes.last30Days : [],
    };
    likeStatsItems.value = Array.isArray(likeStatsRes.items) ? likeStatsRes.items : [];
    const pageItemsByPv = Array.isArray(pagesRes.itemsByPv) ? pagesRes.itemsByPv : [];
    const pageItemsByLatest = Array.isArray(pagesRes.itemsByLatest) ? pagesRes.itemsByLatest : [];
    if (pageItemsByPv.length === 0 && pageItemsByLatest.length === 0) {
      const baseItems = Array.isArray(pagesRes.items) ? pagesRes.items : [];
      itemsByPv.value = baseItems.slice().sort((a, b) => {
        if (b.pv !== a.pv) return b.pv - a.pv;
        return getLastVisitAtTs(b.lastVisitAt) - getLastVisitAtTs(a.lastVisitAt);
      });
      itemsByLatest.value = baseItems.slice().sort((a, b) => {
        const aLast = getLastVisitAtTs(a.lastVisitAt);
        const bLast = getLastVisitAtTs(b.lastVisitAt);
        if (bLast !== aLast) return bLast - aLast;
        return b.pv - a.pv;
      });
    } else {
      itemsByPv.value = pageItemsByPv;
      itemsByLatest.value = pageItemsByLatest;
    }
    last30Days.value = Array.isArray(overviewRes.last30Days) ? overviewRes.last30Days : [];
  } catch (e: any) {
    error.value = e.message || "加载访问统计数据失败";
    showToast(error.value, "error");
  } finally {
    loading.value = false;
    listLoading.value = false;
    await nextTick();
    if (!error.value) renderChart();
  }
}

function changeVisitTab(tab: "pv" | "latest") {
  if (visitTab.value === tab) return;
  visitTab.value = tab;
  saveVisitTabToStorage(tab);
}

function renderChart() {
  const el = chartEl.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);
  const source = last30Days.value;
  const seriesData = chartRange.value === "7" ? source.slice(-7) : source;
  const dates = seriesData.map((item) => item.date.slice(5));
  const values = seriesData.map((item) => item.total);
  chartInstance.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 16, top: 24, bottom: 32 },
    xAxis: { type: "category", data: dates, boundaryGap: false, axisTick: { alignWithLabel: true } },
    yAxis: { type: "value", minInterval: 1 },
    series: [{
      type: "line", smooth: true, data: values,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: "rgba(56, 189, 248, 0.80)" },
        { offset: 1, color: "rgba(56, 189, 248, 0.2)" },
      ]) },
      lineStyle: { width: 2, color: "#0ea5e9" },
      symbol: "circle", symbolSize: 3,
    }],
  });
}

function changeChartRange(range: "7" | "30") {
  if (chartRange.value === range) return;
  chartRange.value = range;
  saveChartRangeToStorage(range);
  renderChart();
}

function handleResize() {
  if (chartInstance) chartInstance.resize();
}

onMounted(() => {
  loadVisitTabFromStorage();
  loadChartRangeFromStorage();
  loadData();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (chartInstance) { chartInstance.dispose(); chartInstance = null; }
});

watch(currentSiteId, () => { loadData(); });
</script>

<style scoped lang="less">
@import "../../styles/components/analyticsvisit.less";
</style>
