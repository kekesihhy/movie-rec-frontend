import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',          name: 'Home',        component: () => import('@/views/Home.vue') },
  { path: '/browse',    name: 'Browse',      component: () => import('@/views/Browse.vue') },
  { path: '/movie/:id', name: 'MovieDetail', component: () => import('@/views/MovieDetail.vue') },
  { path: '/profile',   name: 'Profile',     component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/analytics', name: 'Analytics',   component: () => import('@/views/Analytics.vue') },
  // { path: '/chat',      name: 'ChatBot',     component: () => import('@/views/ChatBot.vue') },
  { path: '/login',     name: 'Login',       component: () => import('@/views/Login.vue'), meta: { guestOnly: true } },
  { path: '/register',  name: 'Register',    component: () => import('@/views/Register.vue'), meta: { guestOnly: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })

router.beforeEach((to, _from, next) => {
  document.title = to.name ? `${to.name} - 电影推荐` : '电影推荐系统'
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) return next({ name: 'Login', query: { redirect: to.fullPath } })
  if (to.meta.guestOnly && token) return next({ name: 'Home' })
  next()
})

export default router