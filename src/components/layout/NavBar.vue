<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="nav-inner">

      <!-- Logo -->
      <router-link to="/" class="nav-logo">🎬 MovieRec</router-link>

      <!-- 导航链接 -->
      <div class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/browse" class="nav-link">全部电影</router-link>
        <router-link to="/analytics" class="nav-link">数据分析</router-link>
      </div>

      <!-- 搜索框 -->
      <div class="nav-search">
        <el-input
          v-model="searchQuery"
          placeholder="搜索电影..."
          size="default"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="hamburger-btn" @click="mobileMenuOpen = !mobileMenuOpen">
        <span v-if="!mobileMenuOpen">☰</span>
        <span v-else>✕</span>
      </button>

      <!-- 右侧操作区 -->
      <div class="nav-actions">
        <!-- 主题切换 -->
        <button class="icon-btn" @click="themeStore.toggle()" :title="themeStore.isDark ? '切换浅色' : '切换深色'">
          <el-icon :size="18"><Sunny v-if="themeStore.isDark" /><Moon v-else /></el-icon>
        </button>

        <!-- 未登录 -->
        <template v-if="!userStore.isLoggedIn">
          <router-link to="/login">
            <el-button size="small" class="btn-ghost">登录</el-button>
          </router-link>
          <router-link to="/register">
            <el-button size="small" class="btn-primary">注册</el-button>
          </router-link>
        </template>

        <!-- 已登录 -->
        <template v-else>
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-avatar">
              <img
                v-if="userStore.userInfo?.avatar_url"
                :src="userStore.userInfo.avatar_url"
                alt="avatar"
              />
              <span v-else>
                {{ userStore.userInfo?.username?.[0]?.toUpperCase() || '?' }}
              </span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <div class="dropdown-header">
                  {{ userStore.userInfo?.username }}
                </div>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </div>

    </div>
    <Transition name="mobile-menu">
      <div class="mobile-menu" v-if="mobileMenuOpen">
        <div class="mobile-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索电影..."
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </div>
        <router-link to="/" class="mobile-link" @click="mobileMenuOpen=false">首页</router-link>
        <router-link to="/browse" class="mobile-link" @click="mobileMenuOpen=false">浏览</router-link>
        <router-link to="/analytics" class="mobile-link" @click="mobileMenuOpen=false">数据分析</router-link>
        <div class="mobile-divider" />
        <button class="mobile-link" @click="themeStore.toggle()">
          {{ themeStore.isDark ? '☀️ 切换浅色' : '🌙 切换深色' }}
        </button>
        <template v-if="!userStore.isLoggedIn">
          <router-link to="/login" class="mobile-link" @click="mobileMenuOpen=false">登录</router-link>
          <router-link to="/register" class="mobile-link" @click="mobileMenuOpen=false">注册</router-link>
        </template>
        <template v-else>
          <router-link to="/profile" class="mobile-link" @click="mobileMenuOpen=false">个人中心</router-link>
          <button class="mobile-link" @click="handleCommand('logout')">退出登录</button>
        </template>
      </div>
    </Transition>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Sunny, Moon, User, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const mobileMenuOpen = ref(false)

const searchQuery = ref('')
const isScrolled = ref(false)

const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ path: '/browse', query: { q } })
  searchQuery.value = ''
}

const handleCommand = (cmd) => {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

const onScroll = () => { isScrolled.value = window.scrollY > 10 }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 64px;
  z-index: 1000;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.navbar.scrolled {
  border-bottom-color: var(--border);
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-logo {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  text-decoration: none;
  white-space: nowrap;
  letter-spacing: 0.5px;
}
.nav-logo:hover { color: var(--accent); }

.nav-links {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.nav-link {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
}
.nav-link:hover { color: var(--text-primary); background: var(--border); }
.nav-link.router-link-active {
  color: var(--text-primary);
  background: rgba(124,58,237,0.15);
}

.nav-search {
  flex: 1;
  max-width: 320px;
}
.nav-search :deep(.el-input__wrapper) {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
  border-radius: 8px;
}
.nav-search :deep(.el-input__wrapper:hover),
.nav-search :deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent) !important;
}
.nav-search :deep(.el-input__inner) {
  color: var(--text-primary) !important;
  background: transparent !important;
  font-size: 13px;
}
.nav-search :deep(.el-input__inner::placeholder) {
  color: var(--text-muted) !important;
}

.nav-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.icon-btn {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.icon-btn:hover { color: var(--text-primary); background: var(--bg-elevated); }

.btn-ghost {
  background: transparent !important;
  border: 1px solid var(--border) !important;
  color: var(--text-secondary) !important;
  border-radius: 8px !important;
}
.btn-ghost:hover { color: var(--text-primary) !important; border-color: var(--text-muted) !important; }

.btn-primary {
  background: linear-gradient(90deg, var(--accent), var(--accent-2)) !important;
  border: none !important;
  color: #fff !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
}

.user-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  border: 2px solid var(--border);
  transition: border-color 0.2s;
}
.user-avatar:hover { border-color: var(--accent); }
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.dropdown-header {
  padding: 8px 16px 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #666);
  border-bottom: 1px solid var(--border, #eee);
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .nav-links { display: none; }
  .nav-search { display: none; }
  .nav-inner { gap: 12px; padding: 0 16px; }
  .nav-logo { font-size: 17px; }
}

.hamburger-btn {
  display: none;
  width: 36px; height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  align-items: center; justify-content: center;
}

.mobile-menu {
  position: absolute;
  top: 64px; left: 0; right: 0;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 16px;
  display: flex; flex-direction: column; gap: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.mobile-search { margin-bottom: 8px; }
.mobile-search :deep(.el-input__wrapper) {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
}
.mobile-search :deep(.el-input__inner) { color: var(--text-primary) !important; }

.mobile-link {
  display: block;
  width: 100%; text-align: left;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px; font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  background: none; border: none;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.mobile-link:hover { background: var(--bg-elevated); color: var(--text-primary); }
.mobile-link.router-link-active { color: var(--accent); }
.mobile-divider { height: 1px; background: var(--border); margin: 6px 0; }

.mobile-menu-enter-active,
.mobile-menu-leave-active { transition: all 0.2s ease; }
.mobile-menu-enter-from,
.mobile-menu-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 768px) {
  .hamburger-btn { display: flex; }
  .nav-actions { display: none; }
}

</style>