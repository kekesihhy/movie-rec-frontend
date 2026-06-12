<template>
  <Transition name="toast-slide">
    <div class="disclaimer-toast" v-if="visible">
      <span class="icon">ℹ️</span>
      <div class="content">
        <div class="title">提示</div>
        <div class="text">本项目仅用于学习交流使用，数据来源于 TMDB 公开数据集</div>
      </div>
      <button class="close-btn" @click="visible = false">✕</button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const visible = ref(false)

const checkAndShow = () => {
  const today = new Date().toDateString()
  const userKey = userStore.userInfo?.id ? `disclaimer_${userStore.userInfo.id}` : 'disclaimer_guest'
  const lastShown = localStorage.getItem(userKey)

  if (lastShown !== today) {
    visible.value = true
    localStorage.setItem(userKey, today)
    setTimeout(() => { visible.value = false }, 5000)
  }
}

// 用户信息加载完成后再判断（避免登录前后重复弹）
watch(() => userStore.userInfo, (val) => {
  if (val !== null || !userStore.token) checkAndShow()
}, { immediate: true })

onMounted(() => {
  if (!userStore.token) checkAndShow()
})
</script>

<style scoped>
.disclaimer-toast {
  position: fixed;
  left: 24px; bottom: 24px;
  display: flex; align-items: flex-start; gap: 14px;
  padding: 18px 22px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.18);
  font-size: 14px;
  color: var(--text-secondary);
  z-index: 998;
  max-width: 400px;
}
.icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
.content { flex: 1; }
.title {
  font-size: 14px; font-weight: 700;
  color: var(--text-primary); margin-bottom: 4px;
}
.text { font-size: 13px; line-height: 1.6; }
.close-btn {
  background: none; border: none;
  color: var(--text-muted); font-size: 14px;
  cursor: pointer; padding: 2px; flex-shrink: 0;
}
.close-btn:hover { color: var(--text-primary); }

.toast-slide-enter-active,
.toast-slide-leave-active { transition: all 0.3s ease; }
.toast-slide-enter-from,
.toast-slide-leave-to { opacity: 0; transform: translateY(16px); }
</style>