import { defineConfig } from 'vitepress';
import { resolve } from 'path';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'howie-daily-helpers',
  description: 'A VitePress Site',
  srcDir: './markdown',
  outDir: './dist',
  cacheDir: './cache',
  vite: {
    // 用 Vite 内置 esbuild 以「自动 JSX 运行时」编译 .tsx，避免 @vitejs/plugin-react 与 VitePress SSR 冲突
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
    // 静态资源目录，与 markdown 目录平级（默认是 <srcDir>/public，这里显式改为上层 public）
    publicDir: resolve(import.meta.dirname, '../public'),
    resolve: {
      alias: {
        // 文档中可直接引用 core 子包源码，便于做可交互示例
        'howie-daily-helpers-core': resolve(import.meta.dirname, '../../../packages/core/src'),
      },
    },
  },
  head: [
    // 浏览器标签页 favicon
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // 这里的 link 是网站的 URL 路径，以 '/' 开头
      { text: 'Home', link: '/' },
      { text: 'Core', link: '/core/' },
    ],

    sidebar: [
      {
        text: 'Core 核心工具',
        items: [
          // 注意：这里不需要写 .md 后缀
          { text: '概览', link: '/core/' },
          { text: 'is 类型判断', link: '/core/is' },
          { text: 'logger 日志记录', link: '/core/logger' },
          { text: 'AsyncTaskScheduler 任务调度', link: '/core/asyncTaskScheduler' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Lhy-study/howie-daily-helpers' },
    ],
  },
});
