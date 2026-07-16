import { h, defineComponent } from 'vue';
import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import LoggerPlayground from './components/LoggerPlayground.vue';
import ReactMount from './components/ReactMount.vue';

// 仅客户端按需加载 React 演示组件，避免 SSR 阶段导入 react-dom/client
const reactDemos = import.meta.glob('./react-demos/*.tsx');

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Vue 版可交互示例
    app.component('LoggerPlayground', LoggerPlayground);
    // React 挂载容器
    app.component('ReactMount', ReactMount);

    if (!import.meta.env.SSR) {
      for (const [path, loader] of Object.entries(reactDemos)) {
        const name = path
          .split('/')
          .pop()!
          .replace(/\.tsx$/, '');
        loader().then((mod) => {
          const Comp = (mod as any).default;
          app.component(
            name,
            defineComponent({
              render: () => h(ReactMount, { component: Comp }),
            }),
          );
        });
      }
    }
  },
} satisfies Theme;
