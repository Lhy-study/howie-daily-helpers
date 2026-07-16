<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { createLogger } from 'howie-daily-helpers-core'

const moduleName = ref('user-service')
const input = ref('服务启动')
const logs = ref<{ id: number; level: string; text: string }[]>([])

const logger = computed(() => createLogger(moduleName.value))

// createLogger 内部映射：info -> console.log
const consoleMap: Record<string, 'log' | 'error' | 'warn' | 'debug'> = {
  info: 'log',
  error: 'error',
  warn: 'warn',
  debug: 'debug',
}

let seq = 0

function run(level: 'info' | 'error' | 'warn' | 'debug') {
  const method = consoleMap[level]
  const original = console[method]
  // 拦截本次调用，把输出同时显示到页面面板
  console[method] = (...args: any[]) => {
    const text = args
      .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
      .join(' ')
    logs.value.push({ id: seq++, level, text })
    original.apply(console, args)
  }
  try {
    logger.value[level](input.value)
  } finally {
    console[method] = original
  }
}

function clear() {
  logs.value = []
}

onUnmounted(clear)
</script>

<template>
  <div class="logger-playground">
    <div class="lp-row">
      <label>模块名</label>
      <input v-model="moduleName" type="text" placeholder="moduleName" />
    </div>
    <div class="lp-row">
      <label>日志内容</label>
      <input v-model="input" type="text" placeholder="要输出的内容" @keyup.enter="run('info')" />
    </div>

    <div class="lp-actions">
      <button class="lp-btn lp-info" @click="run('info')">info</button>
      <button class="lp-btn lp-error" @click="run('error')">error</button>
      <button class="lp-btn lp-warn" @click="run('warn')">warn</button>
      <button class="lp-btn lp-debug" @click="run('debug')">debug</button>
      <button class="lp-btn lp-clear" @click="clear">清空</button>
    </div>

    <div class="lp-console">
      <div v-if="logs.length === 0" class="lp-empty">点击上方按钮，体验 createLogger 输出</div>
      <div v-for="item in logs" :key="item.id" class="lp-line" :class="`lp-${item.level}`">
        <span class="lp-tag">[{{ moduleName }}]</span>
        <span class="lp-text">{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logger-playground {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background: var(--vp-c-bg-soft);
}

.lp-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.lp-row label {
  width: 56px;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.lp-row input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.lp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.lp-btn {
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #fff;
}

.lp-info {
  background: #3b82f6;
}

.lp-error {
  background: #ef4444;
}

.lp-warn {
  background: #f59e0b;
}

.lp-debug {
  background: #8b5cf6;
}

.lp-clear {
  background: #6b7280;
}

.lp-console {
  background: #0d1117;
  color: #c9d1d9;
  border-radius: 6px;
  padding: 12px;
  min-height: 80px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}

.lp-empty {
  color: #6e7681;
}

.lp-line {
  padding: 2px 0;
  white-space: pre-wrap;
}

.lp-tag {
  color: #58a6ff;
  margin-right: 6px;
}

.lp-error .lp-tag {
  color: #ff7b72;
}

.lp-warn .lp-tag {
  color: #d29922;
}

.lp-debug .lp-tag {
  color: #bc8cff;
}
</style>
