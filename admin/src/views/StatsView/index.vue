<template>
  <div class="page">
    <h2 class="page-title">{{ t("stats.title") }}</h2>
    <div v-if="toastVisible" class="toast" :class="toastType === 'error' ? 'toast-error' : 'toast-success'">
      {{ toastMessage }}
    </div>

    <!-- Overview Cards Row -->
    <div class="stats-overview-row">
      <div class="card stats-overview-card">
        <div class="card-title-row">
          <h3 class="card-title">评论概览</h3>
        </div>
        <div v-if="statsLoading" class="page-hint">{{ t("common.loading") }}</div>
        <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
        <div v-else class="stats-grid stats-grid-5">
          <div class="stats-item">
            <div class="stats-label">{{ t("stats.total") }}</div>
            <div class="stats-value">{{ statsSummary.total }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">{{ t("stats.approved") }}</div>
            <div class="stats-value stats-value-approved">{{ statsSummary.approved }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">{{ t("stats.pending") }}</div>
            <div class="stats-value stats-value-pending">{{ statsSummary.pending }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">{{ t("stats.rejected") }}</div>
            <div class="stats-value stats-value-rejected">{{ statsSummary.rejected }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">总点赞</div>
            <div class="stats-value">{{ statsSummary.totalLikes }}</div>
          </div>
        </div>
      </div>
      <div class="card stats-overview-card">
        <div class="card-title-row">
          <h3 class="card-title">说说概览</h3>
        </div>
        <div v-if="statsLoading" class="page-hint">{{ t("common.loading") }}</div>
        <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
        <div v-else class="stats-grid stats-grid-5">
          <div class="stats-item">
            <div class="stats-label">说说总数</div>
            <div class="stats-value">{{ saySummary.total }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">已发布</div>
            <div class="stats-value stats-value-approved">{{ saySummary.published }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">草稿</div>
            <div class="stats-value stats-value-pending">{{ saySummary.draft }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">隐藏</div>
            <div class="stats-value stats-value-rejected">{{ saySummary.hidden }}</div>
          </div>
          <div class="stats-item">
            <div class="stats-label">总点赞</div>
            <div class="stats-value">{{ saySummary.totalLikes }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comment Trend + Say Trend (side by side) -->
    <div class="stats-trend-row">
      <div class="card stats-trend-card">
        <div class="card-title-row">
          <h3 class="card-title">{{ t("stats.trend") }}</h3>
          <div class="chart-tabs">
            <button class="chart-tab" :class="{ 'chart-tab-active': chartRange === '7' }" type="button" @click="changeChartRange('7')">
              {{ t("stats.last7Days") }}
            </button>
            <button class="chart-tab" :class="{ 'chart-tab-active': chartRange === '30' }" type="button" @click="changeChartRange('30')">
              {{ t("stats.last30Days") }}
            </button>
          </div>
        </div>
        <div v-if="statsLoading" class="page-hint">{{ t("common.loading") }}</div>
        <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
        <div class="chart-wrapper">
          <div ref="chartEl" class="chart"></div>
        </div>
      </div>
      <div class="card stats-trend-card">
        <div class="card-title-row">
          <h3 class="card-title">说说趋势</h3>
        </div>
        <div v-if="statsLoading" class="page-hint">{{ t("common.loading") }}</div>
        <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
        <div class="chart-wrapper">
          <div ref="sayTrendEl" class="chart"></div>
        </div>
      </div>
    </div>

    <!-- Status Distribution (linked to overview) -->
    <div class="stats-charts-row">
      <div class="card stats-chart-card">
        <div class="card-title-row">
          <h3 class="card-title">评论状态分布</h3>
        </div>
        <div v-if="statsLoading" class="page-hint">{{ t("common.loading") }}</div>
        <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
        <div class="chart-wrapper">
          <div ref="commentPieEl" class="chart chart-small"></div>
        </div>
      </div>
      <div class="card stats-chart-card">
        <div class="card-title-row">
          <h3 class="card-title">说说状态分布</h3>
        </div>
        <div v-if="statsLoading" class="page-hint">{{ t("common.loading") }}</div>
        <div v-else-if="statsError" class="page-error">{{ statsError }}</div>
        <div class="chart-wrapper">
          <div ref="sayPieEl" class="chart chart-small"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import * as echarts from "echarts";
import { fetchCommentStats } from "../../api/admin";
import { useSite } from "../../composables/useSite";

const { t } = useI18n();

const statsLoading = ref(false);
const statsError = ref("");
const statsSummary = ref({ total: 0, approved: 0, pending: 0, rejected: 0, totalLikes: 0 });
const saySummary = ref({ total: 0, published: 0, draft: 0, hidden: 0, totalLikes: 0 });
const last7Days = ref<{ date: string; total: number }[]>([]);
const sayLast7Days = ref<{ date: string; total: number }[]>([]);
const chartRange = ref<"7" | "30">("7");
const chartRangeStorageKey = "vwd-stats-chart-range";
const { currentSiteId } = useSite();

const toastMessage = ref("");
const toastType = ref<"success" | "error">("success");
const toastVisible = ref(false);

// Chart elements
const chartEl = ref<HTMLDivElement | null>(null);
const commentPieEl = ref<HTMLDivElement | null>(null);
const sayPieEl = ref<HTMLDivElement | null>(null);
const sayTrendEl = ref<HTMLDivElement | null>(null);

// Chart instances
let chartInstance: echarts.ECharts | null = null;
let commentPieInstance: echarts.ECharts | null = null;
let sayPieInstance: echarts.ECharts | null = null;
let sayTrendInstance: echarts.ECharts | null = null;

const allChartInstances = () => [chartInstance, commentPieInstance, sayPieInstance, sayTrendInstance];

function loadChartRangeFromStorage() {
  try {
    const value = window.localStorage.getItem(chartRangeStorageKey);
    if (value === "7" || value === "30") chartRange.value = value;
  } catch {}
}

function saveChartRangeToStorage(value: "7" | "30") {
  try { window.localStorage.setItem(chartRangeStorageKey, value); } catch {}
}

function showToast(msg: string, type: "success" | "error" = "success") {
  toastMessage.value = msg; toastType.value = type; toastVisible.value = true;
  window.setTimeout(() => { toastVisible.value = false; }, 2000);
}

async function loadStats() {
  statsLoading.value = true;
  statsError.value = "";
  try {
    const res = await fetchCommentStats(currentSiteId.value);
    statsSummary.value = { total: res.summary.total, approved: res.summary.approved, pending: res.summary.pending, rejected: res.summary.rejected, totalLikes: res.summary.totalLikes || 0 };
    saySummary.value = res.saySummary || { total: 0, published: 0, draft: 0, hidden: 0, totalLikes: 0 };
    last7Days.value = Array.isArray(res.last7Days) ? res.last7Days : [];
    sayLast7Days.value = Array.isArray(res.sayLast7Days) ? res.sayLast7Days : [];
  } catch (e: any) {
    statsError.value = e.message || "加载统计数据失败";
    showToast(statsError.value, "error");
  } finally {
    statsLoading.value = false;
    await nextTick();
    if (!statsError.value) {
      renderAllCharts();
    }
  }
}

function renderCommentTrendChart() {
  const el = chartEl.value;
  if (!el) return;
  if (!chartInstance) chartInstance = echarts.init(el);
  const source = last7Days.value;
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
      symbol: "circle", symbolSize: 4,
      itemStyle: { color: "#0ea5e9" },
    }],
  });
}

function renderSayTrendChart() {
  const el = sayTrendEl.value;
  if (!el) return;
  if (!sayTrendInstance) sayTrendInstance = echarts.init(el);
  const source = sayLast7Days.value;
  const seriesData = chartRange.value === "7" ? source.slice(-7) : source;
  const dates = seriesData.map((item) => item.date.slice(5));
  const values = seriesData.map((item) => item.total);
  sayTrendInstance.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 36, right: 16, top: 24, bottom: 32 },
    xAxis: { type: "category", data: dates, boundaryGap: true, axisTick: { alignWithLabel: true } },
    yAxis: { type: "value", minInterval: 1 },
    series: [{
      type: "bar", data: values,
      barMaxWidth: 24,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(175, 82, 222, 0.85)" },
          { offset: 1, color: "rgba(175, 82, 222, 0.25)" },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
    }],
  });
}

function renderCommentPieChart() {
  const el = commentPieEl.value;
  if (!el) return;
  if (!commentPieInstance) commentPieInstance = echarts.init(el);
  const data = [
    { name: "已通过", value: statsSummary.value.approved, itemStyle: { color: "#34c759" } },
    { name: "待审核", value: statsSummary.value.pending, itemStyle: { color: "#ff9500" } },
    { name: "已拒绝", value: statsSummary.value.rejected, itemStyle: { color: "#ff3b30" } },
  ].filter(d => d.value > 0);
  commentPieInstance.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, icon: "circle", textStyle: { fontSize: 12 } },
    series: [{
      type: "pie", radius: ["45%", "70%"], center: ["50%", "42%"],
      avoidLabelOverlap: false,
      label: { show: true, formatter: "{b}\n{c}", fontSize: 12 },
      labelLine: { show: true, length: 8, length2: 8 },
      data: data.length > 0 ? data : [{ name: "暂无数据", value: 1, itemStyle: { color: "#e0e0e0" } }],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.3)" } },
    }],
  });
}

function renderSayPieChart() {
  const el = sayPieEl.value;
  if (!el) return;
  if (!sayPieInstance) sayPieInstance = echarts.init(el);
  const data = [
    { name: "已发布", value: saySummary.value.published, itemStyle: { color: "#34c759" } },
    { name: "草稿", value: saySummary.value.draft, itemStyle: { color: "#ff9500" } },
    { name: "隐藏", value: saySummary.value.hidden, itemStyle: { color: "#8e8e93" } },
  ].filter(d => d.value > 0);
  sayPieInstance.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, icon: "circle", textStyle: { fontSize: 12 } },
    series: [{
      type: "pie", radius: ["45%", "70%"], center: ["50%", "42%"],
      avoidLabelOverlap: false,
      label: { show: true, formatter: "{b}\n{c}", fontSize: 12 },
      labelLine: { show: true, length: 8, length2: 8 },
      data: data.length > 0 ? data : [{ name: "暂无数据", value: 1, itemStyle: { color: "#e0e0e0" } }],
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.3)" } },
    }],
  });
}

function renderAllCharts() {
  renderCommentTrendChart();
  renderSayTrendChart();
  renderCommentPieChart();
  renderSayPieChart();
}

function changeChartRange(range: "7" | "30") {
  if (chartRange.value === range) return;
  chartRange.value = range;
  saveChartRangeToStorage(range);
  renderCommentTrendChart();
  renderSayTrendChart();
}

function handleResize() {
  allChartInstances().forEach(inst => { if (inst) inst.resize(); });
}

onMounted(() => {
  loadChartRangeFromStorage();
  loadStats();
  window.addEventListener("resize", handleResize);
});

watch(currentSiteId, () => { loadStats(); });

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  allChartInstances().forEach(inst => { if (inst) { inst.dispose(); } });
  chartInstance = null;
  commentPieInstance = null;
  sayPieInstance = null;
  sayTrendInstance = null;
});
</script>

<style scoped lang="less">
@import "../../styles/components/stats.less";
</style>
