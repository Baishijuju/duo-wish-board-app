<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWishStore, type RewardClaimRecord } from '../stores/wishes'
import { supabase } from '../lib/supabase'
import { fetchRewardClaimsForReview } from '../modules/sync/wish.cloud.fetch'
import { createRewardClaimFromRow } from '../modules/wishes/wish.mapping.cloud'
import { buildMemberWeeklyChart, chartDateKey, weeklyChartDates } from '../shared/memberWeeklyCharts'
import '../shared/reviewUsagePalette.css'

const authStore = useAuthStore()
const wishStore = useWishStore()
const today = ref(chartDateKey(new Date()))
const dates = computed(() => weeklyChartDates(today.value))
const claims = ref<RewardClaimRecord[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const selectedDate = ref<string | null>(null)
const members = computed(() => authStore.members.slice(0, 2))
const charts = computed(() => (['progress', 'coins'] as const).map((metric) => ({
  metric,
  title: metric === 'progress' ? '本周推进分布' : '本周星币入账',
  unit: metric === 'progress' ? '次' : '枚',
  ...buildMemberWeeklyChart(wishStore.wishes, claims.value, members.value.map((member) => member.id), dates.value, metric),
})))
const palettes = ['ocean', 'candy', 'sunset', 'aurora', 'neon', 'tropical', 'macaron']
const paletteIndex = computed(() => (new Date(`${today.value}T00:00:00Z`).getUTCDay() + 6) % 7)
const periodLabel = computed(() => `${formatDay(dates.value[0]!)} - ${formatDay(dates.value[6]!)}`)
let loadSequence = 0
let dateTimer: ReturnType<typeof setInterval> | undefined

function formatDay(date: string) {
  return `${Number(date.slice(5, 7))} 月 ${Number(date.slice(8, 10))} 日`
}

function numberLabel(value: number) {
  return Number(value.toFixed(1)).toString()
}

async function loadClaims() {
  const sequence = ++loadSequence
  const spaceId = authStore.currentSpaceId
  if (!supabase || !authStore.usesSupabaseSpace || !spaceId) {
    claims.value = []
    isLoading.value = false
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await fetchRewardClaimsForReview(supabase, spaceId, dates.value[0]!, dates.value[6]!)
    if (sequence !== loadSequence || spaceId !== authStore.currentSpaceId) return
    if (!result.ok) {
      errorMessage.value = result.message
      return
    }
    claims.value = result.data.claims.map(createRewardClaimFromRow)
  } catch {
    if (sequence === loadSequence) errorMessage.value = '本周数据暂时未能更新。'
  } finally {
    if (sequence === loadSequence) isLoading.value = false
  }
}

watch(
  () => [authStore.currentSpaceId, authStore.usesSupabaseSpace, dates.value[0], wishStore.isLoading, wishStore.rewardClaims.map((claim) => `${claim.id}:${claim.quantity}:${claim.starCoinDelta}`).join('|')] as const,
  () => {
    if (!wishStore.isLoading) void loadClaims()
  },
  { immediate: true },
)
onMounted(() => {
  dateTimer = setInterval(() => { today.value = chartDateKey(new Date()) }, 60000)
})
onBeforeUnmount(() => {
  loadSequence += 1
  if (dateTimer) clearInterval(dateTimer)
})
</script>

<template>
  <div :class="['board-weekly-charts', 'review-usage-layout', `theme-${palettes[paletteIndex]}`]" :aria-busy="isLoading">
    <p v-if="errorMessage" class="chart-error" role="status">{{ errorMessage }} <button type="button" @click="void loadClaims()">重试</button></p>
    <header class="weekly-chart-toolbar">
      <span>{{ periodLabel }}</span>
      <div class="weekly-member-legend">
        <span v-for="(member, index) in members" :key="member.id"><i :class="`member-marker member-marker-${index}`" aria-hidden="true"></i>{{ member.displayName }}</span>
      </div>
    </header>
    <section v-for="chart in charts" :key="chart.metric" class="review-usage-panel member-chart" :aria-label="chart.title">
      <header class="member-chart-heading">
        <h3>{{ chart.metric === 'progress' ? '推进分布' : '星币入账' }}</h3>
      </header>
      <div class="member-chart-totals">
        <span v-for="(member, index) in members" :key="member.id" :aria-label="`${member.displayName}：${numberLabel(chart.totals[index]?.total ?? 0)} ${chart.unit}`" :title="member.displayName">
          <i :class="`member-marker member-marker-${index}`" aria-hidden="true"></i>
          <strong>{{ numberLabel(chart.totals[index]?.total ?? 0) }}</strong> {{ chart.unit }}
        </span>
      </div>
      <div class="member-chart-plot">
        <div class="member-chart-axis" aria-hidden="true"><span>{{ numberLabel(chart.max) }}</span><span>{{ numberLabel(chart.max / 2) }}</span><span>0</span></div>
        <div class="member-chart-days">
          <div v-for="(day, index) in chart.days" :key="day.date" class="member-chart-day" :class="{ 'is-selected': selectedDate === day.date }">
            <div class="member-chart-pair">
              <button
                v-for="(bar, memberIndex) in day.members" :key="bar.ownerId" type="button"
                :class="['member-chart-bar', `member-bar-${memberIndex}`]"
                :aria-label="`${formatDay(day.date)}，${members[memberIndex]?.displayName}，${numberLabel(bar.total)} ${chart.unit}`"
                :title="`${members[memberIndex]?.displayName}：${numberLabel(bar.total)} ${chart.unit}`"
                :aria-pressed="selectedDate === day.date"
                @click="selectedDate = selectedDate === day.date ? null : day.date"
              >
                <span v-for="layer in bar.layers" :key="layer.index" :class="`review-usage-layer review-usage-layer-${layer.index === 5 ? 'other' : layer.index}`" :style="{ height: `${layer.units / chart.max * 100}%` }"></span>
              </button>
            </div>
            <span class="member-chart-weekday">{{ ['一', '二', '三', '四', '五', '六', '日'][index] }}</span>
            <span class="member-chart-date">{{ Number(day.date.slice(8, 10)) }}</span>
          </div>
        </div>
      </div>
      <p v-if="selectedDate" class="member-chart-detail" role="status">
        {{ formatDay(selectedDate) }} · <template v-for="(member, index) in members" :key="member.id">{{ index ? ' · ' : '' }}{{ member.displayName }} {{ numberLabel(chart.days.find((day) => day.date === selectedDate)?.members[index]?.total ?? 0) }} {{ chart.unit }}</template>
      </p>
      <div class="member-chart-legend">
        <span v-for="(category, index) in chart.categories" :key="category"><i :class="`review-usage-dot-${index}`" aria-hidden="true"></i>{{ category }}</span>
        <span v-if="!chart.categories.length">{{ isLoading ? '正在读取本周记录…' : '本周还没有记录' }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.board-weekly-charts { min-width: 0; gap: 0.8rem; }
.weekly-chart-toolbar { display: flex; justify-content: space-between; flex-wrap: wrap; align-items: center; gap: 0.45rem; color: var(--text-soft); font-size: 0.75rem; }
.weekly-member-legend { display: flex; flex-wrap: wrap; gap: 0.7rem; }
.weekly-member-legend > span { display: inline-flex; align-items: center; gap: 0.3rem; }
.member-chart { padding: 0.65rem 0 0; border: 0; border-top: 1px solid var(--line); border-radius: 0; background: transparent; color: var(--text-main); }
.member-chart-heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 0.35rem; }
.member-chart-heading h3 { margin: 0; font-family: var(--font-body); font-size: 0.9rem; font-weight: 600; line-height: 1.4; }
.member-chart-heading > span, .member-chart-totals, .member-chart-detail, .member-chart-legend { font-size: 0.75rem; color: var(--text-soft); }
.member-chart-totals { display: flex; flex-wrap: wrap; gap: 0.4rem 0.9rem; }
.member-chart-totals > span { display: inline-flex; align-items: center; gap: 0.3rem; }
.member-chart-totals strong { color: var(--text-main); }
.member-marker { width: 10px; height: 10px; background: var(--usage-accent); border-radius: 2px; }
.member-marker-1 { background: repeating-linear-gradient(135deg, transparent 0 8px, rgba(255,252,246,0.65) 8px 10px), var(--usage-accent); }
.member-chart-plot { display: grid; grid-template-columns: 1.7rem minmax(0, 1fr); gap: 0.35rem; }
.member-chart-axis { display: flex; height: 7rem; padding-bottom: 2rem; flex-direction: column; justify-content: space-between; text-align: right; color: var(--usage-muted); font-size: 0.66rem; }
.member-chart-days { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); height: 7rem; gap: 0.28rem; }
.member-chart-day { min-width: 0; display: grid; grid-template-rows: minmax(0, 1fr) auto auto; gap: 0.18rem; text-align: center; }
.member-chart-pair { display: flex; min-height: 0; gap: 3px; border-bottom: 1px solid var(--line); }
.member-chart-bar { display: flex; flex: 1 1 0; min-width: 0; height: 100%; padding: 0; flex-direction: column-reverse; justify-content: flex-start; border: 0; border-radius: 4px; overflow: hidden; background: transparent; }
.member-chart-bar.member-bar-1 .review-usage-layer { background-image: repeating-linear-gradient(135deg, transparent 0 8px, rgba(255,252,246,0.65) 8px 10px); }
.review-usage-layer { display: block; width: 100%; flex-shrink: 0; }
.review-usage-layer-0,.review-usage-dot-0 { background-color: var(--usage-layer-0); }
.review-usage-layer-1,.review-usage-dot-1 { background-color: var(--usage-layer-1); }
.review-usage-layer-2,.review-usage-dot-2 { background-color: var(--usage-layer-2); }
.review-usage-layer-3,.review-usage-dot-3 { background-color: var(--usage-layer-3); }
.review-usage-layer-4,.review-usage-dot-4 { background-color: var(--usage-layer-4); }
.review-usage-layer-other { background-color: var(--usage-layer-other); }
.member-chart-weekday,.member-chart-date { font-size: 0.66rem; line-height: 1.1; color: var(--usage-muted); }
.member-chart-legend { display: flex; gap: 0.35rem 0.75rem; flex-wrap: wrap; }
.member-chart-legend > span { display: inline-flex; align-items: center; gap: 0.3rem; }
.member-chart-legend i { width: 7px; height: 7px; border-radius: 50%; }
.member-chart-detail { margin: 0; }
.is-selected { background: var(--usage-track); border-radius: 4px; }
.member-chart-bar:focus-visible { outline: 2px solid var(--usage-accent-deep); outline-offset: 1px; }
.chart-error { font-size: 0.8rem; color: var(--danger, #a14c3e); margin: 0; }
</style>