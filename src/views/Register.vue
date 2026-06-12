<template>
  <div class="auth-page">
    <div class="bg-orb orb-1" />
    <div class="bg-orb orb-2" />
    <div class="bg-orb orb-3" />

    <div class="auth-wrap">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="film-strip">
          <div v-for="i in 6" :key="i" class="frame" />
        </div>
        <div class="brand-body">
          <div class="logo-text">🎬 MovieRec</div>
          <h1>开启你的<br /><em>专属片单</em></h1>
          <ul class="feature-list">
            <li>✦ AI 个性化推荐</li>
            <li>✦ 收藏 & 评分管理</li>
            <li>✦ 4800+ 部影片数据</li>
          </ul>
        </div>
        <div class="film-strip bottom">
          <div v-for="i in 6" :key="i" class="frame" />
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-side">
        <div class="form-card">
          <h2>创建账号</h2>
          <p class="form-sub">几秒钟，开启你的观影旅程</p>

          <el-form :model="form" :rules="rules" ref="formRef" class="reg-form">
            <el-form-item prop="username">
              <el-input
                v-model="form.username"
                placeholder="用户名"
                size="large"
                :prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="邮箱"
                size="large"
                :prefix-icon="Message"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="密码（至少6位）"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item prop="confirm">
              <el-input
                v-model="form.confirm"
                type="password"
                placeholder="确认密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleRegister"
              />
            </el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="submit-btn"
              @click="handleRegister"
            >
              注 册
            </el-button>
          </el-form>

          <div class="form-footer">
            已有账号？<router-link to="/login">立即登录 →</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({ username: '', email: '', password: '', confirm: '' })

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名 2-20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.register({
        username: form.username,
        email: form.email,
        password: form.password
      })
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } catch (err) {
      ElMessage.error(err.response?.data?.detail || '注册失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  overflow: hidden;
}
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.2;
  animation: drift 12s ease-in-out infinite;
}
.orb-1 { width: 500px; height: 500px; background: #7c3aed; top: -100px; left: -100px; animation-delay: 0s; }
.orb-2 { width: 400px; height: 400px; background: #db2777; bottom: -80px; right: 100px; animation-delay: -4s; }
.orb-3 { width: 300px; height: 300px; background: #2563eb; top: 40%; left: 40%; animation-delay: -8s; }
@keyframes drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.05); }
  66%       { transform: translate(-20px, 30px) scale(0.95); }
}
.auth-wrap {
  position: relative;
  z-index: 1;
  display: flex;
  width: 900px;
  min-height: 580px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: 0 32px 80px rgba(0,0,0,0.4);
}
.brand-side {
  flex: 1;
  background: linear-gradient(160deg, rgba(124,58,237,0.15) 0%, var(--bg-surface) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid var(--border);
}
.film-strip { display: flex; }
.film-strip.bottom { transform: rotate(180deg); }
.frame {
  flex: 1;
  height: 40px;
  border-right: 2px solid var(--bg-base);
  background: repeating-linear-gradient(
    90deg,
    var(--bg-elevated) 0px, var(--bg-elevated) 4px,
    var(--bg-base) 4px, var(--bg-base) 8px
  );
  position: relative;
}
.frame::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 18px; height: 22px;
  border: 2px solid var(--border);
  border-radius: 2px;
}
.brand-body { padding: 40px; }
.logo-text { font-size: 18px; font-weight: 700; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 32px; }
.brand-body h1 { font-size: 36px; font-weight: 800; color: var(--text-primary); line-height: 1.3; margin-bottom: 28px; }
.brand-body h1 em {
  font-style: normal;
  background: linear-gradient(90deg, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.feature-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
.feature-list li { color: var(--text-muted); font-size: 14px; letter-spacing: 1px; }
.form-side {
  width: 380px;
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}
.form-card { width: 100%; }
.form-card h2 { font-size: 26px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.form-sub { font-size: 13px; color: var(--text-secondary); margin-bottom: 32px; }
.reg-form :deep(.el-input__wrapper) {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
  border-radius: 8px;
}
.reg-form :deep(.el-input__wrapper:hover),
.reg-form :deep(.el-input__wrapper.is-focus) { border-color: #a78bfa !important; }
.reg-form :deep(.el-input__inner) { color: var(--text-primary) !important; background: transparent !important; }
.reg-form :deep(.el-input__inner::placeholder) { color: var(--text-muted) !important; }
.reg-form :deep(.el-input__prefix-inner .el-icon) { color: var(--text-muted); }
.reg-form :deep(.el-form-item__error) { color: #f472b6; }
.submit-btn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #7c3aed, #db2777) !important;
  border: none !important;
  border-radius: 8px !important;
  margin-top: 4px;
  transition: opacity 0.2s;
}
.submit-btn:hover { opacity: 0.85; }
.form-footer { margin-top: 24px; text-align: center; font-size: 13px; color: var(--text-muted); }
.form-footer a { color: #a78bfa; text-decoration: none; margin-left: 6px; }
.form-footer a:hover { color: #c4b5fd; }
</style>