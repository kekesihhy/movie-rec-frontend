<template>
  <!-- 悬浮球 -->
  <div class="chat-fab" @click="toggleChat" :class="{ open: isOpen }">
    <span v-if="!isOpen">💬</span>
    <span v-else>✕</span>
  </div>

  <!-- 对话框 -->
  <Transition name="chat-slide">
    <div class="chat-window" v-if="isOpen">
      <div class="chat-header">
        <div class="chat-avatar">🎬</div>
        <div>
          <div class="chat-name">小幕</div>
          <div class="chat-status">电影推荐助手</div>
        </div>
        <button class="chat-close" @click="isOpen = false">✕</button>
      </div>

      <div class="chat-messages" ref="msgContainer">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="msg-row"
          :class="msg.role"
        >
          <div v-if="msg.role === 'assistant'" class="msg-icon">🎬</div>
          <div class="msg-bubble" v-html="formatMsg(msg.content)" />
        </div>

        <div v-if="loading" class="msg-row assistant">
          <div class="msg-icon">🎬</div>
          <div class="msg-bubble typing">
            <span /><span /><span />
          </div>
        </div>
      </div>

      <div class="chat-input-wrap">
        <div class="quick-btns" v-if="messages.length <= 1">
          <button
            v-for="q in quickQuestions"
            :key="q"
            class="quick-btn"
            @click="sendMessage(q)"
          >{{ q }}</button>
        </div>
        <div class="chat-input-row">
          <input
            v-model="inputText"
            class="chat-input"
            placeholder="问我任何电影问题..."
            @keyup.enter="handleSend"
            :disabled="loading"
          />
          <button class="send-btn" @click="handleSend" :disabled="loading || !inputText.trim()">
            ↑
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import request from '@/api/request'

const isOpen     = ref(false)
const inputText  = ref('')
const loading    = ref(false)
const msgContainer = ref(null)

const messages = ref([
  { role: 'assistant', content: '你好！我是小幕 🎬\n有什么电影想聊聊，或者需要我帮你推荐？' }
])

const quickQuestions = [
  '推荐几部科幻片',
  '有哪些高分悬疑电影？',
  '适合周末看的喜剧',
  '星际穿越是什么时候上映的？'
]

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const scrollToBottom = async () => {
  await nextTick()
  if (msgContainer.value) {
    msgContainer.value.scrollTop = msgContainer.value.scrollHeight
  }
}

const formatMsg = (text) => {
  return text
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
}

const sendMessage = async (text) => {
  const content = (text || inputText.value).trim()
  if (!content || loading.value) return
  inputText.value = ''

  messages.value.push({ role: 'user', content })
  await scrollToBottom()

  loading.value = true
  try {
    const res = await request.post('/chat/', {
      messages: messages.value
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }))
    })
    messages.value.push({ role: 'assistant', content: res.reply })
  } catch {
    messages.value.push({ role: 'assistant', content: '抱歉，连接出错了，请稍后再试。' })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

const handleSend = () => sendMessage()
</script>

<style scoped>
.chat-fab {
  position: fixed;
  right: 28px; bottom: 28px;
  width: 52px; height: 52px;
  border-radius: 50%;
  background: #0f172a;
  border: 1.5px solid rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  z-index: 1000;
  transition: transform 0.2s, box-shadow 0.2s;
  user-select: none;
}
.chat-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(0,0,0,0.5);
}
.chat-fab.open { font-size: 18px; }

.chat-window {
  position: fixed;
  right: 28px; bottom: 92px;
  width: 360px; height: 520px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  z-index: 999;
  overflow: hidden;
}

.chat-slide-enter-active,
.chat-slide-leave-active { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.chat-slide-enter-from,
.chat-slide-leave-to { opacity: 0; transform: translateY(16px) scale(0.96); }

.chat-header {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  background: #0f172a;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
}
.chat-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.chat-name   { font-size: 14px; font-weight: 700; color: #fff; }
.chat-status { font-size: 11px; color: rgba(255,255,255,0.5); }
.chat-close  {
  margin-left: auto; background: none; border: none;
  color: rgba(255,255,255,0.5); font-size: 16px;
  cursor: pointer; padding: 4px;
}
.chat-close:hover { color: #fff; }

.chat-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 12px;
  scrollbar-width: thin; scrollbar-color: var(--border) transparent;
}
.msg-row { display: flex; align-items: flex-end; gap: 8px; }
.msg-row.user { flex-direction: row-reverse; }

.msg-icon {
  width: 28px; height: 28px; border-radius: 50%;
  background: #1e293b;
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}

.msg-bubble {
  max-width: 75%;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.6;
}
.msg-row.assistant .msg-bubble {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}
.msg-row.user .msg-bubble {
  background: #1e40af;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.typing { display: flex; align-items: center; gap: 4px; padding: 12px 16px; }
.typing span {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--text-muted);
  animation: bounce 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30%           { transform: translateY(-6px); }
}

.quick-btns {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 8px 12px 0;
}
.quick-btn {
  font-size: 11px; padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer; transition: all 0.2s;
}
.quick-btn:hover { border-color: var(--accent); color: var(--accent); }

.chat-input-wrap {
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.chat-input-row { display: flex; gap: 8px; margin-top: 8px; }
.chat-input {
  flex: 1; padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 13px; outline: none;
  transition: border-color 0.2s;
}
.chat-input:focus { border-color: var(--accent); }
.chat-input::placeholder { color: var(--text-muted); }
.send-btn {
  width: 34px; height: 34px; border-radius: 50%;
  background: #1e293b;
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.send-btn:not(:disabled):hover { background: #334155; }

@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 24px);
    right: 12px; left: 12px;
    height: 70vh;
  }
  .chat-fab { right: 16px; bottom: 16px; }
}
</style>