<template>
  <div class="home-page">

    <!-- Hero -->
    <section class="hero" v-if="heroMovies.length">
      <transition name="hero-fade" mode="out-in">
        <div class="hero-slide" :key="currentHero">
          <div class="hero-bg" :style="{ backgroundImage: `url(${heroMovies[currentHero]?.poster_url})` }" />
          <div class="hero-grad-h" />
          <div class="hero-grad-v" />
          <div class="hero-content">
            <div class="hero-info">
              <div class="hero-tags">
                <span v-for="g in heroMovies[currentHero]?.genres?.slice(0,3)" :key="g.id" class="hero-tag">{{ g.name }}</span>
              </div>
              <h1 class="hero-title">{{ heroMovies[currentHero]?.title }}</h1>
              <div class="hero-meta">
                <span class="hero-score">⭐ {{ heroMovies[currentHero]?.vote_average?.toFixed(1) }}</span>
                <span class="sep">|</span>
                <span>{{ heroMovies[currentHero]?.year }}</span>
                <span class="sep">|</span>
                <span>{{ heroMovies[currentHero]?.original_language?.toUpperCase() }}</span>
              </div>
              <p class="hero-desc">{{ heroMovies[currentHero]?.overview?.slice(0, 180) }}{{ (heroMovies[currentHero]?.overview?.length ?? 0) > 180 ? '...' : '' }}</p>
              <el-button class="hero-btn" @click="$router.push(`/movie/${heroMovies[currentHero]?.id}`)">
                查看详情 →
              </el-button>
            </div>
            <div class="hero-poster">
              <img :src="heroMovies[currentHero]?.poster_url" :alt="heroMovies[currentHero]?.title" />
              <div class="poster-shine" />
            </div>
          </div>
        </div>
      </transition>
      <div class="hero-dots">
        <span v-for="(m,i) in heroMovies" :key="m.id" class="dot" :class="{ active: i===currentHero }" @click="jumpTo(i)" />
      </div>
    </section>

    <!-- 统计条 -->
    <!-- <div class="stats-bar">
      <div v-for="s in stats" :key="s.label" class="stat-item">
        <span class="stat-icon">{{ s.icon }}</span>
        <div>
          <div class="stat-num">{{ s.num }}<em>{{ s.unit }}</em></div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div> -->
    <!-- 猜你喜欢（登录后显示） -->
    <section class="movie-section" v-if="userStore.isLoggedIn && recommended.length">
      <div class="section-hd">
        <div class="section-title">
          <span>🎯</span><h2>猜你喜欢</h2>
          <div class="title-bar" />
        </div>
      </div>
      <div class="scroll-zone">
        <div class="scroll-inner">
          <MovieCard v-for="m in recommended" :key="m.id" :movie="m" class="s-card" />
        </div>
        <div class="scroll-fade" />
      </div>
    </section>

    <!-- 热门电影 -->
    <section class="movie-section">
      <div class="section-hd">
        <div class="section-title">
          <span>🔥</span><h2>热门电影</h2>
          <div class="title-bar" />
        </div>
        <router-link :to="{ path: '/browse', query: { sort_by: 'popularity' } }" class="see-all">查看全部 →</router-link>
      </div>
      <div class="scroll-zone">
        <div class="scroll-inner">
          <MovieCard v-for="m in popular" :key="m.id" :movie="m" class="s-card" />
        </div>
        <div class="scroll-fade" />
      </div>
    </section>

    <!-- 高分佳片 -->
    <section class="movie-section alt-bg">
      <div class="section-hd">
        <div class="section-title">
          <span>⭐</span><h2>高分佳片</h2>
          <div class="title-bar" />
        </div>
        <router-link :to="{ path: '/browse', query: { sort_by: 'vote_average' } }" class="see-all">查看全部 →</router-link>
      </div>
      <div class="scroll-zone">
        <div class="scroll-inner">
          <MovieCard v-for="m in topRated" :key="m.id" :movie="m" class="s-card" />
        </div>
        <div class="scroll-fade" />
      </div>
    </section>

    <!-- 类型探索 -->
    <section class="movie-section">
      <div class="section-hd">
        <div class="section-title">
          <span>🎭</span><h2>按类型探索</h2>
          <div class="title-bar" />
        </div>
      </div>
      <div class="genre-grid">
        <div
          v-for="g in genreList" :key="g.name"
          class="genre-card"
          :style="{ backgroundImage: g.posterUrl ? `url(${g.posterUrl})` : 'none', '--gc': g.color }"
          @click="$router.push({ path: '/browse', query: { genre: g.name } })"
        >
          <div v-if="!g.posterUrl" class="gc-placeholder" :style="{ background: g.color }" />
          <div class="gc-overlay" />
          <div class="gc-body">
            <span class="gc-name">{{ g.name }}</span>
            <span class="gc-arrow">▶ 浏览</span>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import request from '@/api/request'
import MovieCard from '@/components/movie/MovieCard.vue'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

const heroMovies  = ref([])
const popular     = ref([])
const topRated    = ref([])
const currentHero = ref(0)
let timer = null

const genreList = ref([
  { name: 'Action',          color: '#ef4444', posterUrl: null },
  { name: 'Comedy',          color: '#f59e0b', posterUrl: null },
  { name: 'Drama',           color: '#8b5cf6', posterUrl: null },
  { name: 'Science Fiction', color: '#3b82f6', posterUrl: null },
  { name: 'Horror',          color: '#374151', posterUrl: null },
  { name: 'Romance',         color: '#ec4899', posterUrl: null },
  { name: 'Animation',       color: '#10b981', posterUrl: null },
  { name: 'Thriller',        color: '#6366f1', posterUrl: null },
  { name: 'Adventure',       color: '#f97316', posterUrl: null },
  { name: 'Crime',           color: '#475569', posterUrl: null },
  { name: 'Fantasy',         color: '#7c3aed', posterUrl: null },
  { name: 'Mystery',         color: '#0891b2', posterUrl: null },
])

const stats = [
  { icon: '🎬', num: '4800', unit: '+', label: '部影片收录' },
  { icon: '🏷️', num: '20',   unit: '+', label: '电影类型' },
  { icon: '🤖', num: 'AI',   unit: '',  label: '智能个性化推荐' },
  { icon: '⭐', num: '100',  unit: '%', label: '免费使用' },
]

const startTimer = () => {
  timer = setInterval(() => {
    currentHero.value = (currentHero.value + 1) % heroMovies.value.length
  }, 5000)
}

const jumpTo = (i) => {
  currentHero.value = i
  clearInterval(timer)
  startTimer()
}

onMounted(async () => {
  const [pop, top] = await Promise.all([
    request.get('/movies/popular', { params: { limit: 20 } }),
    request.get('/movies/top-rated', { params: { limit: 20 } })
  ])
  popular.value  = pop
  topRated.value = top
  heroMovies.value = pop.filter(m => m.poster_url).slice(0, 8)
  startTimer()
  loadGenrePosters()
  loadRecommended()
})

onUnmounted(() => clearInterval(timer))

const loadGenrePosters = async () => {
  const usedPosters = new Set()
  for (let i = 0; i < genreList.value.length; i++) {
    const g = genreList.value[i]
    try {
      const data = await request.get('/movies', {
        params: { genre: g.name, size: 10, sort_by: 'popularity' }
      })
      const movie = data.items?.find(m => m.poster_url && !usedPosters.has(m.poster_url))
      if (movie) {
        genreList.value[i].posterUrl = movie.poster_url
        usedPosters.add(movie.poster_url)
      }
    } catch (e) {}
  }
}
const recommended = ref([])

const loadRecommended = async () => {
  if (!userStore.isLoggedIn) return
  try {
    recommended.value = await request.get('/recommend/for-me', { params: { n: 20 } })
  } catch {
    recommended.value = []
  }
}
</script>

<style scoped>
.home-page { padding-bottom: 80px; }

/* ── Hero ── */
.hero {
  position: relative;
  height: 64vh;
  min-height: 500px;
  overflow: hidden;
}
.hero-slide { position: absolute; inset: 0; }
.hero-bg {
  position: absolute;
  inset: -8%;
  background-size: cover;
  background-position: center 15%;
  filter: blur(38px) brightness(0.35) saturate(2.8);
  transform: scale(1.1);
}
.hero-grad-h {
  position: absolute; inset: 0;
  background: linear-gradient(
    to right,
    rgba(4,4,10,0.98) 0%,
    rgba(4,4,10,0.88) 32%,
    rgba(4,4,10,0.45) 60%,
    rgba(4,4,10,0.08) 82%,
    transparent 100%
  );
}
.hero-grad-v {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(4,4,10,0.9) 0%, transparent 50%);
}
.hero-content {
  position: relative; z-index: 2;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 80px;
  display: flex;
  align-items: center;
  gap: 48px;
}
.hero-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 20px;
}
.hero-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.hero-tag {
  padding: 3px 12px;
  border-radius: 3px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.25);
  font-size: 11px;
  color: rgba(255,255,255,0.75);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  backdrop-filter: blur(6px);
}
.hero-title {
  font-family: 'Bebas Neue', Impact, sans-serif;
  font-size: clamp(42px, 5.8vw, 76px);
  font-weight: 400;
  letter-spacing: 4px;
  color: #fff;
  line-height: 1.02;
  text-shadow: 0 4px 32px rgba(0,0,0,0.6);
  max-width: 520px;
  text-transform: uppercase;
}
.hero-meta {
  display: flex; align-items: center; gap: 12px;
  font-size: 15px; color: rgba(255,255,255,0.65);
}
.hero-score {
  color: #fbbf24;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
}
.sep { opacity: 0.25; }
.hero-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  line-height: 1.8;
  max-width: 460px;
  font-weight: 300;
}
.hero-btn {
  width: fit-content !important;
  height: 48px !important;
  padding: 0 36px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 3px !important;
  text-transform: uppercase;
  background: transparent !important;
  border: 1.5px solid rgba(255,255,255,0.6) !important;
  border-radius: 4px !important;
  color: #fff !important;
  transition: all 0.25s !important;
  backdrop-filter: blur(4px);
}
.hero-btn:hover {
  background: rgba(255,255,255,0.12) !important;
  border-color: #fff !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important;
}

.hero-poster {
  flex-shrink: 0;
  height: calc(64vh - 80px);
  max-height: 480px;
  min-height: 300px;
  position: relative;
}
.hero-poster img {
  height: 100%; width: auto;
  border-radius: 16px;
  box-shadow: -16px 0 60px rgba(0,0,0,0.7), 0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
  display: block;
}
.poster-shine {
  position: absolute; inset: 0;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%);
  pointer-events: none;
}
.hero-dots {
  position: absolute; bottom: 24px; left: 80px;
  display: flex; gap: 8px; z-index: 3;
}
.dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.3); cursor: pointer;
  transition: all 0.3s;
}
.dot.active { background: #fff; width: 24px; border-radius: 4px; }
.hero-fade-enter-active,
.hero-fade-leave-active { transition: opacity 0.7s ease; }
.hero-fade-enter-from,
.hero-fade-leave-to { opacity: 0; }

/* ── 统计条 ── */
.stats-bar {
  display: flex; align-items: center; justify-content: center;
  gap: 0;
  padding: 24px 40px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
}
.stat-item {
  display: flex; align-items: center; gap: 14px;
  padding: 0 52px;
  border-right: 1px solid var(--border);
}
.stat-item:last-child { border-right: none; }
.stat-icon { font-size: 28px; }
.stat-num {
  font-size: 24px; font-weight: 800;
  color: var(--text-primary); line-height: 1;
}
.stat-num em { font-style: normal; font-size: 16px; color: var(--accent); }
.stat-label { font-size: 12px; color: var(--text-muted); margin-top: 3px; }

/* ── 电影区块 ── */
.movie-section {
  padding: 52px 0 0;
}
.alt-bg { background: var(--bg-surface); padding: 52px 0; margin: 24px 0; }
.section-hd {
  max-width: 1400px; margin: 0 auto;
  padding: 0 32px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.section-title {
  display: flex; align-items: center; gap: 10px;
}
.section-title span { font-size: 22px; }
.section-title h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); }
.title-bar {
  width: 36px; height: 3px; border-radius: 2px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}
.see-all { font-size: 14px; color: var(--accent); text-decoration: none; }
.see-all:hover { opacity: 0.75; }

.scroll-zone {
  position: relative;
  max-width: 1400px; margin: 0 auto;
  padding: 0 32px;
  overflow: hidden;
}
.scroll-inner {
  display: flex; gap: 16px;
  overflow-x: auto;
  padding-bottom: 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.s-card { width: 155px; flex-shrink: 0; }
.scroll-fade {
  position: absolute;
  top: 0; right: 32px; bottom: 12px;
  width: 100px;
  background: linear-gradient(to right, transparent, var(--bg-base));
  pointer-events: none;
}
.alt-bg .scroll-fade {
  background: linear-gradient(to right, transparent, var(--bg-surface));
}

/* ── 类型 ── */
.genre-section { padding: 52px 0 0; }

.genre-grid {
  max-width: 1400px; margin: 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}

.genre-card {
  position: relative;
  aspect-ratio: 2/3;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  background-size: cover;
  background-position: center top;
  background-color: var(--bg-elevated);
}
.genre-card::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.95) 0%,
    rgba(0,0,0,0.55) 40%,
    rgba(0,0,0,0.1) 100%
  );
  transition: background 0.3s;
}
.genre-card:hover::after {
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.98) 0%,
    rgba(0,0,0,0.65) 45%,
    rgba(0,0,0,0.2) 100%
  );
}
/* 图片缩放效果 */
.genre-card {
  transition: transform 0.3s, box-shadow 0.3s;
}
.genre-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 48px rgba(0,0,0,0.55);
}

.gc-placeholder { position: absolute; inset: 0; opacity: 0.6; }

.gc-body {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 16px 14px;
  z-index: 1;
}

/* 彩色底边装饰线 */
.gc-body::before {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: var(--gc);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s;
}
.genre-card:hover .gc-body::before { transform: scaleX(1); }

.gc-name {
  display: block;
  font-family: 'Bebas Neue', Impact, sans-serif;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: 2px;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  line-height: 1;
  margin-bottom: 4px;
}

.gc-arrow {
  font-size: 13px;
  color: var(--gc);
  opacity: 0;
  display: inline-block;
  transition: opacity 0.2s, transform 0.2s;
}
.genre-card:hover .gc-arrow {
  opacity: 1;
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .hero { height: auto; min-height: auto; padding: 32px 0; }
  .hero-slide { position: relative; }
  .hero-content { flex-direction: column; padding: 0 20px; gap: 24px; }
  .hero-info { max-width: 100%; }
  .hero-poster { display: none; }
  .stats-bar { flex-wrap: wrap; padding: 16px; }
  .stat-item { padding: 8px 16px; border-right: none; }
  .charts-grid, .genre-grid, .movie-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .movie-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 10px !important;
  }
  .scroll-inner .s-card,
  .scroll-card {
    width: 110px !important;
  }
  .genre-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important;
  }
  .gc-name { font-size: 13px !important; }
}
</style>