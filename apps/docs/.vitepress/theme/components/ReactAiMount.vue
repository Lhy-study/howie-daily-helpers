<template>
  <ClientOnly>
    <div ref="hostEl" class="floating-btn-host" @click="handleClick" :class="{ 'active': isOpen }">
      <!-- 智能助手图标 -->
      <svg class="ai-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"
          opacity="0.15" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
        <circle cx="15.5" cy="10" r="1.5" fill="currentColor" />
        <path d="M8 14c0 0 1.5 2 4 2s4-2 4-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1" stroke-linecap="round"
          opacity="0.4" />
      </svg>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { createRoot, Root } from 'react-dom/client';
import { EventEmitter } from 'howie-daily-helpers-core/eventEmitter';
// 假设你的 React 组件叫 App，它应该包含按钮逻辑和弹窗逻辑
import App from '../react-widget/App';
import React from 'react';

const hostEl = ref<HTMLDivElement | null>(null);
const isOpen = ref(true);
const eventEmitter = new EventEmitter<'open' | 'close'>();
let reactRoot: Root | null = null;

function handleClick() {
  eventEmitter.emit('open');
  isOpen.value = false;
}

// 监听关闭事件，恢复按钮显示
eventEmitter.on('close', () => {
  isOpen.value = true;
});

onMounted(() => {
  nextTick(() => {
    if (hostEl.value) {
      // 1. 创建 Shadow DOM 隔离环境
      const wrapper = document.createElement('div');
      hostEl.value.appendChild(wrapper);

      const shadowRoot = wrapper.attachShadow({ mode: 'open' });

      // 2. 注入基础重置样式到 Shadow DOM 内部
      const style = document.createElement('style');
      style.textContent = `
      :host { all: initial; }
      div { box-sizing: border-box; }
    `;
      shadowRoot.appendChild(style);

      // 3. 挂载 React
      const mountPoint = document.createElement('div');
      shadowRoot.appendChild(mountPoint);

      reactRoot = createRoot(mountPoint);
      reactRoot.render(React.createElement(App, { eventEmitter }));
    }
  })
});

onUnmounted(() => {
  reactRoot?.unmount();
});
</script>

<style scoped>
.floating-btn-host {
  visibility: hidden;

  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  color: #fff;
  /* 移动端触摸优化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.floating-btn-host:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.floating-btn-host:active {
  transform: scale(0.95);
}

.ai-icon {
  width: 28px;
  height: 28px;
}

.active {
  visibility: visible;
}

/* 平板 */
@media (max-width: 768px) {
  .floating-btn-host {
    width: 50px;
    height: 50px;
    bottom: 20px;
    right: 20px;
  }

  .ai-icon {
    width: 24px;
    height: 24px;
  }
}

/* 手机 */
@media (max-width: 480px) {
  .floating-btn-host {
    width: 44px;
    height: 44px;
    bottom: 16px;
    right: 16px;
  }

  .ai-icon {
    width: 22px;
    height: 22px;
  }
}
</style>