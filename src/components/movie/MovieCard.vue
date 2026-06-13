<template>
  <div class="movie-card" @click="$router.push(`/movie/${movie.id}`)">
    <!-- 海报 -->
    <div class="poster-wrap">
      <img
        v-if="posterUrl"
        :src="posterUrl"
        :alt="movie.title"
        class="poster"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="poster-fallback">
        <span class="fallback-icon">🎬</span>
        <span class="fallback-title">{{ movie.title }}</span>
      </div>

      <!-- 评分角标 -->
      <div class="score-badge" :class="scoreClass">
        ⭐ {{ movie.vote_average?.toFixed(1) ?? 'N/A' }}
      </div>

      <!-- 悬停遮罩 -->
      <div class="hover-mask">
        <div class="genres">
          <span
            v-for="g in movie.genres?.slice(0, 3)"
            :key="g.id"
            class="genre-tag"
          >{{ g.name }}</span>
        </div>
        <div class="hover-btn">查看详情 →</div>
      </div>
    </div>

    <!-- 卡片底部信息 -->
    <div class="card-info">
      <div class="card-title" :title="movie.title">{{ movie.title }}</div>
      <div class="card-meta">
        <span>{{ movie.year ?? '未知' }}</span>
        <span class="dot">·</span>
        <span>{{ movie.original_language?.toUpperCase() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  movie: { type: Object, required: true }
})

const imgError = ref(false)

const posterUrl = computed(() => {
  if (imgError.value) return null
  if (props.movie.poster_url) return props.movie.poster_url
  return null
})

const scoreClass = computed(() => {
  const s = props.movie.vote_average ?? 0
  if (s >= 8) return 'score-high'
  if (s >= 6) return 'score-mid'
  return 'score-low'
})
</script>

<style scoped>
.movie-card {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  transition: transform 0.25s, box-shadow 0.25s;
}
.movie-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.4);
}

/* 海报区域 */
.poster-wrap {
  position: relative;
  aspect-ratio: 2/3;
  overflow: hidden;
  background: var(--bg-elevated);
}
.poster {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.movie-card:hover .poster { transform: scale(1.05); }

/* 无图降级 */
.poster-fallback {
  width: 100%; height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-surface));
}
.fallback-icon { font-size: 48px; opacity: 0.4; }
.fallback-title {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 评分角标 */
.score-badge {
  position: absolute;
  top: 8px; right: 8px;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  backdrop-filter: blur(4px);
}
.score-high { background: rgba(34,197,94,0.85); color: #fff; }
.score-mid  { background: rgba(234,179,8,0.85);  color: #1a1a1a; }
.score-low  { background: rgba(239,68,68,0.85);  color: #fff; }

/* 悬停遮罩 */
.hover-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s;
}
.movie-card:hover .hover-mask { opacity: 1; }
.genres { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
.genre-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(124,58,237,0.7);
  color: #fff;
}
.hover-btn {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

/* 底部信息 */
.card-info { padding: 12px; }
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
.card-meta {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot { opacity: 0.4; }
.movie-card {
  min-width: 0;
}
.poster-wrap img,
.poster {
  max-width: 100%;
}
</style>