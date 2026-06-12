<template>
  <div class="app-root">
    <NavBar v-if="showNav" />
    <main class="main-content" :class="{ 'with-nav': showNav }">
      <router-view v-slot="{ Component, route }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>
    <Footer v-if="showNav" />
    <ChatBot />
    <DisclaimerToast />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import Footer from '@/components/layout/Footer.vue'
import ChatBot from '@/components/chat/ChatBot.vue'
import DisclaimerToast from '@/components/layout/DisclaimerToast.vue'

const route = useRoute()
const showNav = computed(() => !['Login', 'Register'].includes(route.name))
</script>

<style>
body {
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 胶片噪点层 */
#app::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.045;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: screen;
}
/* 深色变量（默认） */
:root {
  --bg-base:     #0a0a0f;
  --bg-surface:  #111118;
  --bg-elevated: #1a1a24;
  --text-primary:   #ffffff;
  --text-secondary: rgba(255,255,255,0.6);
  --text-muted:     rgba(255,255,255,0.3);
  --border:      rgba(255,255,255,0.1);
  --nav-bg:      rgba(10,10,15,0.85);
  --accent:      #7c3aed;
  --accent-2:    #db2777;
}
/* 浅色变量 */
.theme-light {
  --bg-base:     #f0f0f5;
  --bg-surface:  #ffffff;
  --bg-elevated: #f8f8fc;
  --text-primary:   #0f0f1a;
  --text-secondary: rgba(0,0,0,0.65);
  --text-muted:     rgba(0,0,0,0.35);
  --border:      rgba(0,0,0,0.1);
  --nav-bg:      rgba(240,240,245,0.88);
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  min-height: 100vh;
  background-color: var(--bg-base);
  color: var(--text-primary);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  transition: background-color 0.3s, color 0.3s;
}
.main-content.with-nav { padding-top: 64px; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-surface); }
::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }

:root {
  --el-bg-color-overlay: var(--bg-surface);
  --el-text-color-regular: var(--text-secondary);
  --el-text-color-primary: var(--text-primary);
  --el-border-color-light: var(--border);
  --el-border-color: var(--border);
  --el-fill-color-light: var(--bg-elevated);
}
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>