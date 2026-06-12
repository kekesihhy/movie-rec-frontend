import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/api/request'

export const useUserStore = defineStore('user', () => {
  const token    = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const isLoggedIn = computed(() => !!token.value)

  async function login(credentials) {
    const res = await request.post('/auth/login', credentials)
    token.value = res.access_token
    localStorage.setItem('token', res.access_token)
    await fetchUserInfo()
  }

  async function register(data) {
    return await request.post('/auth/register', data)
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try { userInfo.value = await request.get('/auth/me') }
    catch { logout() }
  }

  function logout() {
    token.value = ''; userInfo.value = null
    localStorage.removeItem('token')
  }

  if (token.value) fetchUserInfo()

  return { token, userInfo, isLoggedIn, login, register, fetchUserInfo, logout }
})