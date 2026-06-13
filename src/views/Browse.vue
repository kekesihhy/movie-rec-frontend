<template>
  <div class="browse-page">

    <!-- 左侧筛选栏 -->
    <aside class="filter-sidebar" :class="{ 'filter-closed': !filterOpen }">
      <div class="filter-header">
        <span>筛选</span>
        <el-button link size="small" @click="resetFilters">重置</el-button>
      </div>

      <div class="filter-section">
        <div class="filter-label">类型</div>
        <div class="genre-tags">
          <span
            v-for="g in genres"
            :key="g.id"
            class="genre-tag"
            :class="{ active: filters.genre === g.name }"
            @click="toggleGenre(g.name)"
          >{{ g.name }}</span>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-label">年份</div>
        <el-input
          v-model.number="filters.year"
          placeholder="如 2020"
          size="small"
          clearable
          @change="onFilterChange"
        />
      </div>

      <div class="filter-section">
        <div class="filter-label">
          评分范围：{{ filters.minRating }} - {{ filters.maxRating }}
        </div>
        <el-slider
          v-model="ratingRange"
          range
          :min="0" :max="10" :step="0.5"
          @change="onFilterChange"
        />
      </div>

      <div class="filter-section">
        <div class="filter-label">语言</div>
        <el-select
          v-model="filters.language"
          placeholder="全部语言"
          size="small"
          clearable
          @change="onFilterChange"
        >
          <el-option v-for="l in languages" :key="l.value" :label="l.label" :value="l.value" />
        </el-select>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="browse-main">
      <div class="browse-header">
        <h2>
          <template v-if="searchQuery">搜索：<em>{{ searchQuery }}</em></template>
          <template v-else>全部电影</template>
        </h2>
        <div class="header-right">
          <el-button size="small" class="filter-btn" @click="filterOpen = !filterOpen">
            {{ filterOpen ? '收起筛选 ▲' : '展开筛选 ▼' }}
          </el-button>
          <span class="total-count">共 {{ total }} 部</span>
          <el-select
            v-model="sortBy"
            size="small"
            style="width:120px"
            @change="onFilterChange"
          >
            <el-option label="综合排序" value="popularity" />
            <el-option label="按评分"   value="vote_average" />
            <el-option label="按年份"   value="year" />
            <el-option label="按评价数" value="vote_count" />
          </el-select>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="loading-grid">
        <el-skeleton
          v-for="i in 20" :key="i"
          animated
          class="skeleton-card"
        >
          <template #template>
            <el-skeleton-item variant="image" style="aspect-ratio:2/3;border-radius:8px;" />
            <el-skeleton-item variant="text" style="margin-top:8px;width:80%" />
            <el-skeleton-item variant="text" style="width:50%" />
          </template>
        </el-skeleton>
      </div>

      <!-- 电影网格 -->
      <div v-else-if="movies.length" class="movie-grid">
        <MovieCard
          v-for="movie in movies"
          :key="movie.id"
          :movie="movie"
        />
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="没有找到相关电影" :image-size="120" />

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next, jumper"
          background
          @current-change="handlePageChange"
        />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'
import MovieCard from '@/components/movie/MovieCard.vue'
const filterOpen = ref(false)

const route  = useRoute()
const router = useRouter()

const movies   = ref([])
const genres   = ref([])
const total    = ref(0)
const loading  = ref(false)
const pageSize = 20

// 全部状态从 URL 初始化
const sortBy      = ref(route.query.sort_by || 'popularity')
const currentPage = ref(Number(route.query.page) || 1)
const filters = reactive({
  genre:     route.query.genre    || null,
  year:      route.query.year     ? Number(route.query.year) : null,
  minRating: route.query.min_r    ? Number(route.query.min_r) : 0,
  maxRating: route.query.max_r    ? Number(route.query.max_r) : 10,
  language:  route.query.language || null,
})
const ratingRange = computed({
  get: () => [filters.minRating, filters.maxRating],
  set: ([min, max]) => { filters.minRating = min; filters.maxRating = max }
})
const searchQuery = computed(() => route.query.q || '')

const languages = [
  { label: '英语 en', value: 'en' }, { label: '法语 fr', value: 'fr' },
  { label: '德语 de', value: 'de' }, { label: '日语 ja', value: 'ja' },
  { label: '韩语 ko', value: 'ko' }, { label: '西班牙语 es', value: 'es' },
  { label: '意大利语 it', value: 'it' }, { label: '中文 zh', value: 'zh' },
]

// URL 同步（用 replace 不产生历史记录）
let internalNav = false
const syncURL = () => {
  internalNav = true
  const q = {}
  if (searchQuery.value)             q.q        = searchQuery.value
  if (sortBy.value !== 'popularity') q.sort_by  = sortBy.value
  if (currentPage.value > 1)         q.page     = String(currentPage.value)
  if (filters.genre)                 q.genre    = filters.genre
  if (filters.year)                  q.year     = String(filters.year)
  if (filters.minRating > 0)         q.min_r    = String(filters.minRating)
  if (filters.maxRating < 10)        q.max_r    = String(filters.maxRating)
  if (filters.language)              q.language = filters.language
  router.replace({ query: q })
  setTimeout(() => { internalNav = false }, 100)
}

// 监听外部导航（如首页点类型/排序跳过来）
watch(() => route.query, (q) => {
  if (internalNav) return
  sortBy.value      = q.sort_by  || 'popularity'
  currentPage.value = Number(q.page) || 1
  filters.genre     = q.genre    || null
  filters.year      = q.year     ? Number(q.year)  : null
  filters.minRating = q.min_r    ? Number(q.min_r) : 0
  filters.maxRating = q.max_r    ? Number(q.max_r) : 10
  filters.language  = q.language || null
  loadMovies(currentPage.value)
}, { deep: true })

const loadGenres = async () => {
  genres.value = await request.get('/movies/genres')
}

const loadMovies = async (page = 1) => {
  loading.value = true
  currentPage.value = page
  try {
    let data
    if (searchQuery.value) {
      data = await request.get('/movies/search', {
        params: { q: searchQuery.value, page, size: pageSize }
      })
    } else {
      const params = { page, size: pageSize, sort_by: sortBy.value }
      if (filters.genre)          params.genre      = filters.genre
      if (filters.year)           params.year       = filters.year
      if (filters.minRating > 0)  params.min_rating = filters.minRating
      if (filters.maxRating < 10) params.max_rating = filters.maxRating
      if (filters.language)       params.language   = filters.language
      data = await request.get('/movies', { params })
    }
    movies.value = data.items
    total.value  = data.total
  } finally {
    loading.value = false
  }
}

const toggleGenre = (name) => {
  filters.genre = filters.genre === name ? null : name
  onFilterChange()
}
const onFilterChange = () => { currentPage.value = 1; syncURL(); loadMovies(1) }
const resetFilters = () => {
  sortBy.value = 'popularity'
  Object.assign(filters, { genre: null, year: null, minRating: 0, maxRating: 10, language: null })
  syncURL(); loadMovies(1)
}
const handlePageChange = (page) => { syncURL(); loadMovies(page) }

onMounted(() => { loadGenres(); loadMovies(currentPage.value) })
</script>

<style scoped>
.browse-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  gap: 28px;
  align-items: flex-start;
}

/* 左侧筛选 */
.filter-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;

  max-height: calc(100vh - 100px);
  overflow: hidden;
  transition: max-width 0.3s ease, opacity 0.3s ease, padding 0.3s ease, border-color 0.3s;
  max-width: 220px;
}
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}
.filter-section { margin-bottom: 24px; }
.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.genre-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.genre-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.genre-tag:hover { border-color: var(--accent); color: var(--accent); }
.genre-tag.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* 筛选组件覆盖 */
.filter-sidebar :deep(.el-input__wrapper) {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
}
.filter-sidebar :deep(.el-input__inner) { color: var(--text-primary) !important; }
.filter-sidebar :deep(.el-select__wrapper) {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
  color: var(--text-primary) !important;
}
.filter-sidebar :deep(.el-slider__bar) { background: var(--accent); }
.filter-sidebar :deep(.el-slider__button) { border-color: var(--accent); }

/* 右侧主区域 */
.browse-main { flex: 1; min-width: 0; }
.browse-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 24px;
}
.browse-header h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}
.browse-header h2 em {
  font-style: normal;
  color: var(--accent);
}
.total-count { font-size: 14px; color: var(--text-muted); }

/* 网格 */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}

/* 骨架屏 */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
}
.skeleton-card { border-radius: 12px; overflow: hidden; }

/* 分页 */
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
.pagination-wrap :deep(.el-pagination) {
  color: var(--text-secondary);
}
.pagination-wrap :deep(.el-pagination .btn-prev),
.pagination-wrap :deep(.el-pagination .btn-next),
.pagination-wrap :deep(.el-pager li) {
  background: var(--bg-elevated) !important;
  color: var(--text-secondary) !important;
}
.pagination-wrap :deep(.el-pager li.is-active) {
  background: var(--accent) !important;
  color: #fff !important;
}
.pagination-wrap :deep(.el-pagination__total),
.pagination-wrap :deep(.el-pagination__jump) {
  color: var(--text-secondary) !important;
}
.pagination-wrap :deep(.el-pagination .el-input__wrapper) {
  background: var(--bg-elevated) !important;
  box-shadow: none !important;
  border: 1px solid var(--border) !important;
}
.pagination-wrap :deep(.el-pagination .el-input__inner) {
  color: var(--text-primary) !important;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.filter-sidebar.filter-closed {
  max-width: 0;
  opacity: 0;
  padding: 0;
  border-color: transparent;
}

.filter-btn {
  border: 1px solid var(--border) !important;
  color: var(--text-secondary) !important;
  background: transparent !important;
  border-radius: 8px !important;
}
.filter-btn:hover {
  color: var(--text-primary) !important;
  border-color: var(--text-muted) !important;
}

.browse-main :deep(.el-select__wrapper) {
  background-color: #0a0a0f !important;
  box-shadow: 0 0 0 1px #ffffff99 inset !important;
}
</style>