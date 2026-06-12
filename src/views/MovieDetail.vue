<template>
  <div class="detail-page" v-if="movie">

    <!-- 顶部 Hero -->
    <div class="detail-hero">
      <div class="hero-bg" :style="{ backgroundImage: `url(${movie.poster_url})` }" />
      <div class="hero-grad-h" />
      <div class="hero-grad-v" />

      <div class="hero-inner">
        <!-- 海报 -->
        <div class="poster-col">
          <img
            v-if="movie.poster_url"
            :src="movie.poster_url"
            :alt="movie.title"
            class="poster-img"
          />
          <div v-else class="poster-placeholder">🎬</div>
        </div>

        <!-- 信息 -->
        <div class="info-col">
          <div class="genre-tags">
            <span v-for="g in movie.genres" :key="g.id" class="genre-tag">{{ g.name }}</span>
          </div>
          <h1 class="movie-title">{{ movie.title }}</h1>
          <p v-if="movie.original_title !== movie.title" class="original-title">
            {{ movie.original_title }}
          </p>

          <div class="meta-row">
            <span class="score-big">⭐ {{ movie.vote_average?.toFixed(1) }}</span>
            <span class="meta-sep">|</span>
            <span>{{ movie.year }}</span>
            <span class="meta-sep">|</span>
            <span v-if="movie.runtime">{{ movie.runtime }} min</span>
            <span class="meta-sep">|</span>
            <span>{{ movie.original_language?.toUpperCase() }}</span>
          </div>

          <p class="vote-sub">{{ movie.vote_count?.toLocaleString() }} 人评分</p>

          <p v-if="movie.tagline" class="tagline">"{{ movie.tagline }}"</p>

          <p class="overview">{{ movie.overview }}</p>

          <!-- 用户评分 -->
          <div class="rating-block">
            <span class="rating-label">我的评分</span>
            <el-rate
              v-model="myRating"
              :max="5"
              allow-half
              :colors="['#fbbf24','#fbbf24','#fbbf24']"
              @change="handleRate"
            />
            <span v-if="myRating" class="rating-val">{{ myRating }} 星</span>
          </div>

          <div class="action-btns">
            <el-button class="btn-favorite" :loading="favoriteLoading" @click="toggleFavorite">
              {{ isFavorite ? '❤️ 已收藏' : '🤍 收藏' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细信息 -->
    <div class="detail-body">

      <!-- 制作公司 -->
      <div v-if="movie.companies?.length" class="section">
        <h3 class="section-title">制作公司</h3>
        <div class="companies">
          <span v-for="c in movie.companies" :key="c.id" class="company-tag">{{ c.name }}</span>
        </div>
      </div>

      <!-- 更多信息 -->
      <div class="section info-grid">
        <div v-if="movie.budget" class="info-item">
          <span class="info-label">预算</span>
          <span class="info-val">${{ (movie.budget / 1e6).toFixed(1) }}M</span>
        </div>
        <div v-if="movie.revenue" class="info-item">
          <span class="info-label">票房</span>
          <span class="info-val">${{ (movie.revenue / 1e6).toFixed(1) }}M</span>
        </div>
        <div v-if="movie.release_date" class="info-item">
          <span class="info-label">上映日期</span>
          <span class="info-val">{{ movie.release_date }}</span>
        </div>
        <div v-if="movie.homepage" class="info-item">
          <span class="info-label">官网</span>
          <a :href="movie.homepage" target="_blank" class="info-link">访问官网 →</a>
        </div>
      </div>

      <!-- 相似电影 -->
      <div class="section" v-if="similar.length">
        <h3 class="section-title">相似电影</h3>
        <div class="scroll-zone">
          <div class="scroll-inner">
            <MovieCard
              v-for="m in similar"
              :key="m.id"
              :movie="m"
              class="s-card"
            />
          </div>
          <div class="scroll-fade" />
        </div>
      </div>

    </div>
  </div>

  <!-- 加载中 -->
  <div v-else class="loading-page">
    <el-skeleton :rows="8" animated />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import MovieCard from '@/components/movie/MovieCard.vue'
import { useUserStore } from '@/stores/user'

const route      = useRoute()
const userStore  = useUserStore()

const movie      = ref(null)
const similar    = ref([])
const myRating   = ref(0)
const isFavorite = ref(false)
const ratingLoading   = ref(false)
const favoriteLoading = ref(false)

const loadMovie = async (id) => {
  movie.value = null
  try {
    movie.value = await request.get(`/movies/${id}`)
    loadSimilar()
    if (userStore.isLoggedIn) {
      loadMyRating(id)
      loadFavoriteStatus(id)
    }
  } catch {
    ElMessage.error('电影不存在')
  }
}

const loadSimilar = async () => {
  try {
    similar.value = await request.get(`/recommend/similar/${movie.value.id}`, {
      params: { n: 10 }
    })
  } catch {
    similar.value = []
  }
}

const loadMyRating = async (id) => {
  try {
    const data = await request.get(`/ratings/movies/${id}/mine`)
    myRating.value = data.rating
  } catch {
    myRating.value = 0
  }
}

const loadFavoriteStatus = async (id) => {
  try {
    const data = await request.get(`/ratings/favorites/${id}/check`)
    isFavorite.value = data.is_favorite
  } catch {
    isFavorite.value = false
  }
}

const handleRate = async (val) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录再评分')
    myRating.value = 0
    return
  }
  ratingLoading.value = true
  try {
    await request.post(`/ratings/movies/${movie.value.id}`, { rating: val })
    ElMessage.success(`评分 ${val} 星成功`)
  } catch {
    ElMessage.error('评分失败')
  } finally {
    ratingLoading.value = false
  }
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  favoriteLoading.value = true
  try {
    if (isFavorite.value) {
      await request.delete(`/ratings/favorites/${movie.value.id}`)
      isFavorite.value = false
      ElMessage.success('已取消收藏')
    } else {
      await request.post(`/ratings/favorites/${movie.value.id}`)
      isFavorite.value = true
      ElMessage.success('已加入收藏')
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    favoriteLoading.value = false
  }
}

watch(() => route.params.id, (id) => { if (id) loadMovie(id) })
onMounted(() => loadMovie(route.params.id))
</script>

<style scoped>
/* Hero */
.detail-hero {
  position: relative;
  min-height: 520px;
  overflow: hidden;
}
.hero-bg {
  position: absolute; inset: -8%;
  background-size: cover; background-position: center;
  filter: blur(45px) brightness(0.22) saturate(2);
  transform: scale(1.1);
}
.hero-grad-h {
  position: absolute; inset: 0;
  background: linear-gradient(to right, rgba(4,4,10,0.98) 0%, rgba(4,4,10,0.75) 50%, rgba(4,4,10,0.3) 100%);
}
.hero-grad-v {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(4,4,10,1) 0%, transparent 40%);
}
.hero-inner {
  position: relative; z-index: 2;
  max-width: 1400px; margin: 0 auto;
  padding: 60px 80px;
  display: flex; gap: 56px; align-items: flex-start;
}

/* 海报 */
.poster-col { flex-shrink: 0; }
.poster-img {
  width: 240px;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08);
}
.poster-placeholder {
  width: 240px; aspect-ratio: 2/3;
  border-radius: 14px;
  background: var(--bg-elevated);
  display: flex; align-items: center; justify-content: center;
  font-size: 60px;
}

/* 信息区 */
.info-col {
  flex: 1; display: flex; flex-direction: column; gap: 14px; padding-top: 8px;
}
.genre-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.genre-tag {
  padding: 3px 12px; border-radius: 3px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 11px; color: rgba(255,255,255,0.75);
  text-transform: uppercase; letter-spacing: 1.5px;
}
.movie-title {
  font-family: 'Bebas Neue', Impact, sans-serif;
  font-size: clamp(36px, 4.5vw, 62px);
  font-weight: 400; letter-spacing: 3px;
  color: #fff; line-height: 1;
  text-shadow: 0 4px 24px rgba(0,0,0,0.5);
}
.original-title { font-size: 15px; color: rgba(255,255,255,0.4); margin-top: -8px; }

.meta-row {
  display: flex; align-items: center; gap: 12px;
  font-size: 15px; color: rgba(255,255,255,0.65);
}
.score-big { color: #fbbf24; font-weight: 700; font-size: 20px; }
.meta-sep  { opacity: 0.25; }
.vote-sub  { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: -8px; }

.tagline {
  font-size: 15px; color: rgba(255,255,255,0.45);
  font-style: italic; letter-spacing: 0.5px;
}
.overview {
  font-size: 14px; color: rgba(255,255,255,0.6);
  line-height: 1.8; max-width: 640px; font-weight: 300;
}

/* 评分 */
.rating-block {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  width: fit-content;
}
.rating-label { font-size: 13px; color: rgba(255,255,255,0.5); }
.rating-val   { font-size: 13px; color: #fbbf24; font-weight: 600; }

/* 收藏按钮 */
.btn-favorite {
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.2) !important;
  color: #fff !important; border-radius: 8px !important;
  font-size: 14px !important; height: 40px !important; padding: 0 20px !important;
  transition: all 0.2s !important;
}
.btn-favorite:hover {
  background: rgba(255,255,255,0.15) !important;
  border-color: rgba(255,255,255,0.4) !important;
}

/* 详情主体 */
.detail-body {
  max-width: 1400px; margin: 0 auto;
  padding: 40px 80px 80px;
  display: flex; flex-direction: column; gap: 48px;
}
.section-title {
  font-size: 18px; font-weight: 700;
  color: var(--text-primary); margin-bottom: 16px;
  display: flex; align-items: center; gap: 10px;
}
.section-title::after {
  content: '';
  flex: 1; height: 1px;
  background: var(--border);
  margin-left: 8px;
}

/* 制作公司 */
.companies { display: flex; flex-wrap: wrap; gap: 8px; }
.company-tag {
  padding: 6px 14px; border-radius: 6px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  font-size: 13px; color: var(--text-secondary);
}

/* 更多信息网格 */
.info-grid { display: flex; flex-wrap: wrap; gap: 24px; }
.info-item { display: flex; flex-direction: column; gap: 4px; min-width: 120px; }
.info-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
.info-val   { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.info-link  { font-size: 14px; color: var(--accent); text-decoration: none; }
.info-link:hover { opacity: 0.8; }

/* 相似电影 */
.scroll-zone { position: relative; overflow: hidden; }
.scroll-inner {
  display: flex; gap: 16px; overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin; scrollbar-color: var(--border) transparent;
}
.s-card { width: 155px; flex-shrink: 0; }
.scroll-fade {
  position: absolute; top: 0; right: 0; bottom: 8px; width: 100px;
  background: linear-gradient(to right, transparent, var(--bg-base));
  pointer-events: none;
}

/* 加载 */
.loading-page {
  max-width: 1400px; margin: 80px auto; padding: 0 80px;
}
</style>