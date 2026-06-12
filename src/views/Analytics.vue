<template>
  <div class="analytics-page">

    <!-- Header -->
    <div class="a-header">
      <div class="a-header-inner">
        <h1 class="a-title">TMDB 电影数据分析</h1>
        <p class="a-sub">基于 4,795 部影片的多维度数据可视化</p>
        <div class="kpi-row" v-if="kpi">
          <span><b>{{ kpi.total.toLocaleString() }}</b> 部影片</span>
          <span class="dot">·</span>
          <span><b>{{ kpi.avg_rating }}</b> 平均评分</span>
          <span class="dot">·</span>
          <span><b>{{ kpi.avg_runtime }}</b> 分钟平均片长</span>
          <span class="dot">·</span>
          <span><b>{{ kpi.year_min }}–{{ kpi.year_max }}</b></span>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="a-loading">
      <div v-for="i in 6" :key="i" class="skeleton-card" />
    </div>

    <!-- 图表网格 -->
    <div v-else class="charts-grid">

      <div class="c-card span-3">
        <div class="c-title">电影类型分布</div>
        <div ref="r1" class="c-box" />
      </div>
      <div class="c-card span-3">
        <div class="c-title">发行年份与评分趋势</div>
        <div ref="r2" class="c-box" />
      </div>

      <div class="c-card span-3">
        <div class="c-title">预算最高 Top 10（百万美元）</div>
        <div ref="r3" class="c-box" />
      </div>
      <div class="c-card span-3">
        <div class="c-title">高产公司 Top 10</div>
        <div ref="r4" class="c-box" />
      </div>

      <div class="c-card span-3">
        <div class="c-title">评分分布</div>
        <div ref="r5" class="c-box" />
      </div>
      <div class="c-card span-3">
        <div class="c-title">语言分布 Top 10</div>
        <div ref="r6" class="c-box" />
      </div>

      <div class="c-card span-3">
        <div class="c-title">高频关键词 Top 20</div>
        <div ref="r7" class="c-box" />
      </div>
      <div class="c-card span-3">
        <div class="c-title">年代类型演变</div>
        <div ref="r8" class="c-box" />
      </div>

      <div class="c-card span-4">
        <div class="c-title">预算与票房关系（百万美元）</div>
        <div ref="r9" class="c-box" />
      </div>
      <div class="c-card span-2">
        <div class="c-title">类型平均评分</div>
        <div ref="r11" class="c-box c-box-tall" />
      </div>

      <div class="c-card span-6">
        <div class="c-title">流行度与评分关系</div>
        <div ref="r10" class="c-box" />
      </div>

    </div>
  </div>
</template>

<script setup>
import 'echarts-wordcloud'
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/api/request'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const loading = ref(true)
const kpi = ref(null)

const r1=ref(null),r2=ref(null),r3=ref(null),r4=ref(null),
      r5=ref(null),r6=ref(null),r7=ref(null),r8=ref(null),
      r9=ref(null),r10=ref(null),r11=ref(null)

const instances = []
let allData = null

const colors = () => ({
  text:  themeStore.isDark ? '#8b949e' : '#666',
  grid:  themeStore.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  line:  themeStore.isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)',
  tip:   themeStore.isDark ? 'rgba(22,27,34,0.97)'    : 'rgba(255,255,255,0.97)',
  tipBorder: themeStore.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  tipText:   themeStore.isDark ? '#e6edf3' : '#1a1a2e',
})

const BRAND = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1','#06b6d4','#84cc16']

const axisStyle = (c) => ({
  axisLabel: { color: c.text, fontSize: 11 },
  axisLine:  { lineStyle: { color: c.line } },
  splitLine: { lineStyle: { color: c.grid, type: 'dashed' } }
})
const tooltip = (c) => ({
  backgroundColor: c.tip, borderColor: c.tipBorder,
  textStyle: { color: c.tipText, fontSize: 12 }
})
const GRID = { left:'2%', right:'4%', top:'6%', bottom:'6%', containLabel:true }

function buildCharts(d) {
  instances.forEach(c => c.dispose())
  instances.length = 0
  const [g,kw,bud,rt,co,la,brev,yr,pr,decade,genreAvg] = d
  const c = colors()

  const mk = (el, opt) => {
    const chart = echarts.init(el)
    chart.setOption({ backgroundColor:'transparent', ...opt })
    instances.push(chart)
  }

  // 1. 类型分布（横向条形）
  const gs = [...g].slice(0,12).reverse()
  mk(r1.value, {
    tooltip:{ ...tooltip(c), trigger:'axis' },
    grid:{ ...GRID, left:'18%' },
    xAxis:{ type:'value', ...axisStyle(c) },
    yAxis:{ type:'category', data:gs.map(d=>d.name), ...axisStyle(c) },
    series:[{ type:'bar', data:gs.map(d=>d.value), barMaxWidth:18,
      itemStyle:{ borderRadius:[0,3,3,0],
        color: new echarts.graphic.LinearGradient(1,0,0,0,
          [{offset:0,color:'#7c3aed'},{offset:1,color:'rgba(124,58,237,0.25)'}]) } }]
  })

  // 2. 年份评分折线
  mk(r2.value, {
    tooltip:{ ...tooltip(c), trigger:'axis',
      formatter:(p)=>`${p[0].axisValue}年<br/>均分: <b>${p[0].data}</b>` },
    grid:GRID,
    xAxis:{ type:'category', data:yr.map(d=>d.year), ...axisStyle(c),
      axisLabel:{ ...axisStyle(c).axisLabel, interval: 4 } },
    yAxis:{ type:'value', min:5, max:8, ...axisStyle(c) },
    series:[{ type:'line', data:yr.map(d=>d.avg_rating), smooth:true,
      lineStyle:{ width:2, color:'#3b82f6' }, symbol:'none',
      areaStyle:{ opacity:0.12, color: new echarts.graphic.LinearGradient(0,0,0,1,
        [{offset:0,color:'#3b82f6'},{offset:1,color:'transparent'}]) } }]
  })

  // 3. 预算 Top10
  const bs = [...bud].reverse()
  mk(r3.value, {
    tooltip:{ ...tooltip(c), trigger:'axis', formatter:(p)=>`${p[0].name}<br/>$${p[0].data}M` },
    grid:{ ...GRID, left:'24%' },
    xAxis:{ type:'value', ...axisStyle(c) },
    yAxis:{ type:'category', data:bs.map(d=>d.title), ...axisStyle(c),
    axisLabel:{ ...axisStyle(c).axisLabel,
      formatter:(v)=>v.length>16?v.slice(0,16)+'…':v } },
    series:[{ type:'bar', data:bs.map(d=>d.budget), barMaxWidth:16,
      itemStyle:{ borderRadius:[0,3,3,0], color:'#3b82f6' },
      label:{ show:true, position:'right', formatter:'{c}M', color:c.text, fontSize:10 } }]
  })

  // 4. 高产公司 Top10
  const cs = [...co].reverse()
  mk(r4.value, {
    tooltip:{ ...tooltip(c), trigger:'axis' },
    grid:{ ...GRID, left:'30%' },
    xAxis:{ type:'value', ...axisStyle(c) },
    yAxis:{ type:'category', data:cs.map(d=>d.name), ...axisStyle(c),
    axisLabel:{ ...axisStyle(c).axisLabel,
      formatter:(v)=>v.length>20?v.slice(0,20)+'…':v } },
    series:[{ type:'bar', data:cs.map(d=>d.count), barMaxWidth:16,
      itemStyle:{ borderRadius:[0,3,3,0], color:'#10b981' },
      label:{ show:true, position:'right', color:c.text, fontSize:10 } }]
  })

  // 5. 评分分布
  mk(r5.value, {
    tooltip:{ ...tooltip(c), trigger:'axis' },
    grid:GRID,
    xAxis:{ type:'category', data:rt.map(d=>d.range), ...axisStyle(c),
      axisLabel:{ ...axisStyle(c).axisLabel, rotate:45 } },
    yAxis:{ type:'value', ...axisStyle(c) },
    series:[{ type:'bar', data:rt.map(d=>d.count), barMaxWidth:24,
      itemStyle:{ borderRadius:[3,3,0,0],
        color: new echarts.graphic.LinearGradient(0,0,0,1,
          [{offset:0,color:'#f59e0b'},{offset:1,color:'rgba(245,158,11,0.2)'}]) } }]
  })

  // 6. 语言分布饼图
  mk(r6.value, {
    color: BRAND,
    tooltip:{ ...tooltip(c), trigger:'item', formatter:'{b}: {c} ({d}%)' },
    legend:{ orient:'vertical', right:'2%', top:'center',
      textStyle:{ color:c.text, fontSize:11 }, itemWidth:10,
      formatter: (name) => name.toUpperCase() },
    series:[{ type:'pie', radius:['40%','68%'], center:['38%','50%'],
      data: la.map(d => ({ name: d.language, value: d.count })),
      label:{ show:false },
      emphasis:{ label:{ show:true, fontSize:13, fontWeight:'bold',
        formatter: (p) => p.name.toUpperCase() } } }]
  })

  // 7. 关键词词云
  mk(r7.value, {
    tooltip:{ ...tooltip(c), formatter: (p) => `${p.name}: ${p.value}` },
    series:[{
      type: 'wordCloud',
      shape: 'circle',
      sizeRange: [12, 48],
      rotationRange: [-45, 45],
      rotationStep: 15,
      gridSize: 6,
      width: '95%',
      height: '95%',
      textStyle: {
        fontWeight: 600,
        color: () => BRAND[Math.floor(Math.random() * BRAND.length)]
      },
      data: kw.slice(0, 60).map(d => ({ name: d.name, value: d.value }))
    }]
  })

  // 8. 年代类型演变（堆叠面积）
  mk(r8.value, {
    tooltip:{ ...tooltip(c), trigger:'axis' },
    legend:{ data: decade.series.map(s=>s.name), top:0,
      textStyle:{ color:c.text, fontSize:10 }, itemWidth:10, itemHeight:10 },
    grid:{ ...GRID, top:'18%' },
    xAxis:{ type:'category', data: decade.decades, ...axisStyle(c) },
    yAxis:{ type:'value', ...axisStyle(c) },
    color: BRAND,
    series: decade.series.map(s => ({
      name: s.name, type:'line', stack:'total', smooth:true,
      areaStyle:{ opacity:0.6 }, lineStyle:{ width:1 }, symbol:'none',
      data: s.data
    }))
  })

  // 9. 预算 vs 票房 散点
  mk(r9.value, {
    tooltip:{ ...tooltip(c), trigger:'item',
      formatter:(p)=>`${brev[p.dataIndex]?.title||''}<br/>预算: $${p.data[0]}M  票房: $${p.data[1]}M` },
    grid:GRID,
    xAxis:{ type:'value', name:'预算(M$)', nameTextStyle:{color:c.text,fontSize:10}, ...axisStyle(c) },
    yAxis:{ type:'value', name:'票房(M$)', nameTextStyle:{color:c.text,fontSize:10}, ...axisStyle(c) },
    series:[{ type:'scatter', data:brev.map(d=>[d.x,d.y]), symbolSize:5,
      itemStyle:{ color:'#f59e0b', opacity:0.55 } }]
  })

  // 10. 流行度 vs 评分
  mk(r10.value, {
    tooltip:{ ...tooltip(c), trigger:'item',
      formatter:(p)=>`${pr[p.dataIndex]?.title||''}<br/>流行度: ${p.data[0]}  评分: ${p.data[1]}` },
    grid:GRID,
    xAxis:{ type:'value', name:'流行度', nameTextStyle:{color:c.text,fontSize:10}, ...axisStyle(c) },
    yAxis:{ type:'value', name:'评分', nameTextStyle:{color:c.text,fontSize:10}, min:0, max:10, ...axisStyle(c) },
    series:[{ type:'scatter', data:pr.map(d=>[d.x,d.y]), symbolSize:5,
      itemStyle:{ color:'#ef4444', opacity:0.5 } }]
  })

  // 11. 类型平均评分（纵向，长卡片）
  mk(r11.value, {
    tooltip:{ ...tooltip(c), trigger:'axis',
      formatter:(p)=>`${p[0].name}<br/>均分: ${p[0].data}` },
    grid:{ ...GRID, left:'26%' },
    xAxis:{ type:'value', min:5, max:7.5, ...axisStyle(c) },
    yAxis:{ type:'category', data:[...genreAvg].reverse().map(d=>d.name), ...axisStyle(c),
    axisLabel:{ ...axisStyle(c).axisLabel,
      formatter:(v)=>v.length>14?v.slice(0,14)+'…':v } },
    series:[{ type:'bar', data:[...genreAvg].reverse().map(d=>d.avg), barMaxWidth:14,
      itemStyle:{ borderRadius:[0,3,3,0],
        color: new echarts.graphic.LinearGradient(1,0,0,0,
          [{offset:0,color:'#06b6d4'},{offset:1,color:'rgba(6,182,212,0.2)'}]) },
      label:{ show:true, position:'right', color:c.text, fontSize:10 } }]
  })
}

onMounted(async () => {
  const [statsRes, ...chartRes] = await Promise.all([
    request.get('/analytics/stats'),
    request.get('/analytics/genre-distribution'),
    request.get('/analytics/top-keywords'),
    request.get('/analytics/top-budget'),
    request.get('/analytics/rating-distribution'),
    request.get('/analytics/top-companies'),
    request.get('/analytics/language-distribution'),
    request.get('/analytics/budget-vs-revenue'),
    request.get('/analytics/year-vs-rating'),
    request.get('/analytics/popularity-vs-rating'),
    request.get('/analytics/genre-by-decade'),
    request.get('/analytics/genre-avg-rating'),
  ])
  kpi.value = statsRes
  allData = chartRes
  loading.value = false
  await nextTick()
  buildCharts(allData)
})

watch(() => themeStore.isDark, async () => {
  await nextTick()
  if (allData) buildCharts(allData)
})

const onResize = () => instances.forEach(c => c.resize())
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => {
  instances.forEach(c => c.dispose())
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.analytics-page { min-height: 100vh; background: var(--bg-base); }

.a-header {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 36px 0;
}
.a-header-inner { max-width: 1400px; margin: 0 auto; padding: 0 40px; }
.a-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.a-sub   { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }
.kpi-row { font-size: 13px; color: var(--text-secondary); }
.kpi-row b { color: var(--text-primary); font-weight: 700; }
.kpi-row .dot { margin: 0 12px; opacity: 0.4; }

.a-loading { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; padding: 32px 40px; }
.skeleton-card {
  height: 300px; border-radius: 10px;
  background: var(--bg-surface);
  animation: pulse 1.5s ease-in-out infinite alternate;
}
@keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }

.charts-grid {
  display: grid; grid-template-columns: repeat(6,1fr);
  gap: 16px; padding: 28px 40px 60px;
  max-width: 1400px; margin: 0 auto;
}
.span-2 { grid-column: span 2; }
.span-3 { grid-column: span 3; }
.span-4 { grid-column: span 4; }
.span-6 { grid-column: span 6; }

.c-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 18px;
}
.c-title {
  font-size: 13px; font-weight: 600;
  color: var(--text-secondary); margin-bottom: 14px;
}
.c-box { height: 260px; }
.c-box-tall { height: 564px; }
</style>