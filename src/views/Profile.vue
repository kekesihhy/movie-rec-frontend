<template>
  <div class="profile-page">

    <!-- 用户信息卡 -->
    <div class="profile-hero">
      <div class="profile-hero-inner">
        <div class="avatar-wrap">
          <img v-if="userInfo?.avatar_url" :src="userInfo.avatar_url" class="avatar-img" />
          <div v-else class="avatar-placeholder">{{ userInfo?.username?.[0]?.toUpperCase() }}</div>
        </div>
        <div class="user-meta">
          <h1 class="username">{{ userInfo?.username }}</h1>
          <p class="email">{{ userInfo?.email }}</p>
          <div class="user-stats">
            <div class="stat">
              <span class="stat-num">{{ ratings.length }}</span>
              <span class="stat-label">评分</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ favorites.length }}</span>
              <span class="stat-label">收藏</span>
            </div>
          </div>
        </div>
        <div class="profile-actions">
          <el-button class="edit-btn" @click="showEditDialog = true">编辑资料</el-button>
          <el-button class="edit-btn" @click="showPwdDialog = true">修改密码</el-button>
          <el-button class="danger-btn" @click="deleteAccount">注销账号</el-button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="profile-body">
      <el-tabs v-model="activeTab" class="profile-tabs">

        <!-- 我的评分 -->
        <el-tab-pane label="我的评分" name="ratings">
          <div v-if="ratings.length" class="movie-grid">
            <div v-for="r in ratings" :key="r.movie_id" class="rated-card">
              <MovieCard :movie="r.movie" />
              <div class="rated-info">
                <el-rate
                  :model-value="r.rating"
                  :max="5"
                  allow-half
                  disabled
                  :colors="['#fbbf24','#fbbf24','#fbbf24']"
                />
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="deleteRating(r.movie_id)"
                >删除</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="还没有评分记录" />
        </el-tab-pane>

        <!-- 我的收藏 -->
        <el-tab-pane label="我的收藏" name="favorites">
          <div v-if="favorites.length" class="movie-grid">
            <div v-for="f in favorites" :key="f.movie_id" class="rated-card">
              <MovieCard :movie="f.movie" />
              <div class="rated-info">
                <span class="fav-date">{{ f.created_at?.slice(0,10) }}</span>
                <el-button
                  link
                  type="danger"
                  size="small"
                  @click="removeFavorite(f.movie_id)"
                >取消收藏</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else description="还没有收藏" />
        </el-tab-pane>

        <!-- 专属推荐 -->
        <el-tab-pane label="专属推荐" name="recommend">
          <div v-if="recommended.length" class="movie-grid">
            <MovieCard v-for="m in recommended" :key="m.id" :movie="m" />
          </div>
          <el-empty v-else description="评分 5 部以上解锁专属推荐" />
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- 编辑资料弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑资料" width="420px" align-center>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="头像链接">
          <el-input v-model="editForm.avatar_url" placeholder="输入图片 URL" />
        </el-form-item>
        <el-form-item label="偏好类型">
          <el-input v-model="editForm.preferred_genres" placeholder="如：Action,Drama" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showPwdDialog" title="修改密码" width="380px" align-center>
      <el-form :model="pwdForm" label-width="90px">
        <el-form-item label="原密码">
          <el-input v-model="pwdForm.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="pwdForm.confirm" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPwdDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import MovieCard from '@/components/movie/MovieCard.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const userInfo  = ref(userStore.userInfo)

const activeTab      = ref('ratings')
const ratings        = ref([])
const favorites      = ref([])
const recommended    = ref([])
const showEditDialog = ref(false)
const showPwdDialog = ref(false)
const pwdForm = reactive({ old_password: '', new_password: '', confirm: '' })

const changePassword = async () => {
  if (pwdForm.new_password.length < 6) {
    ElMessage.warning('新密码至少6位')
    return
  }
  if (pwdForm.new_password !== pwdForm.confirm) {
    ElMessage.warning('两次密码不一致')
    return
  }
  try {
    await request.put('/auth/password', {
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password
    })
    ElMessage.success('密码已修改，请重新登录')
    showPwdDialog.value = false
    setTimeout(() => {
      userStore.logout()
      window.location.href = '/login'
    }, 1000)
  } catch (err) {
    ElMessage.error(err.response?.data?.detail || '修改失败')
  }
}

const deleteAccount = async () => {
  try {
    await ElMessageBox.confirm(
      '注销后账号数据将永久删除，无法恢复，确定继续吗？',
      '注销账号',
      { type: 'error', confirmButtonText: '确定注销', cancelButtonText: '取消' }
    )
    await request.delete('/auth/me')
    ElMessage.success('账号已注销')
    userStore.logout()
    window.location.href = '/login'
  } catch {
    // 取消操作，忽略
  }
}

const editForm = reactive({
  avatar_url:       userStore.userInfo?.avatar_url || '',
  preferred_genres: userStore.userInfo?.preferred_genres || ''
})

const loadData = async () => {
  const [r, f, rec] = await Promise.allSettled([
    request.get('/ratings/me'),
    request.get('/ratings/favorites/me'),
    request.get('/recommend/for-me', { params: { n: 20 } })
  ])
  if (r.status === 'fulfilled') ratings.value   = r.value
  if (f.status === 'fulfilled') favorites.value = f.value
  if (rec.status === 'fulfilled') recommended.value = rec.value
}

const deleteRating = async (movieId) => {
  await ElMessageBox.confirm('确定删除这条评分？', '提示', { type: 'warning' })
  await request.delete(`/ratings/movies/${movieId}`)
  ratings.value = ratings.value.filter(r => r.movie_id !== movieId)
  ElMessage.success('已删除')
}

const removeFavorite = async (movieId) => {
  await request.delete(`/ratings/favorites/${movieId}`)
  favorites.value = favorites.value.filter(f => f.movie_id !== movieId)
  ElMessage.success('已取消收藏')
}

const saveProfile = async () => {
  await request.put('/auth/me', editForm)
  await userStore.fetchUserInfo()
  userInfo.value = userStore.userInfo
  showEditDialog.value = false
  ElMessage.success('已保存')
}

onMounted(loadData)
</script>

<style scoped>
.profile-page { min-height: 100vh; }

/* Hero */
.profile-hero {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 48px 0;
}
.profile-hero-inner {
  max-width: 1400px; margin: 0 auto;
  padding: 0 80px;
  display: flex; align-items: center; gap: 32px;
}
.avatar-wrap { flex-shrink: 0; }
.avatar-img {
  width: 96px; height: 96px; border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--accent);
}
.avatar-placeholder {
  width: 96px; height: 96px; border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 700; color: #fff;
}
.user-meta { flex: 1; }
.username  { font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.email     { font-size: 14px; color: var(--text-muted); margin-bottom: 16px; }
.user-stats { display: flex; gap: 32px; }
.stat { display: flex; flex-direction: column; }
.stat-num   { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 12px; color: var(--text-muted); }

.edit-btn {
  background: transparent !important;
  border: 1px solid var(--border) !important;
  color: var(--text-secondary) !important;
  border-radius: 8px !important;
}
.edit-btn:hover { border-color: var(--accent) !important; color: var(--accent) !important; }
.profile-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.danger-btn {
  background: transparent !important;
  border: 1px solid rgba(239,68,68,0.4) !important;
  color: #ef4444 !important;
  border-radius: 8px !important;
}
.danger-btn:hover {
  background: rgba(239,68,68,0.1) !important;
  border-color: #ef4444 !important;
}

/* Body */
.profile-body {
  max-width: 1400px; margin: 0 auto;
  padding: 32px 80px 80px;
}
.profile-tabs :deep(.el-tabs__nav-wrap::after) { background: var(--border); }
.profile-tabs :deep(.el-tabs__item) { color: var(--text-secondary); font-size: 15px; }
.profile-tabs :deep(.el-tabs__item.is-active) { color: var(--accent); }
.profile-tabs :deep(.el-tabs__active-bar) { background: var(--accent); }

/* 电影网格 */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 20px;
  margin-top: 24px;
}
.rated-card { display: flex; flex-direction: column; gap: 8px; }
.rated-info {
  display: flex; justify-content: space-between;
  align-items: center; padding: 0 4px;
}
.fav-date { font-size: 12px; color: var(--text-muted); }
</style>