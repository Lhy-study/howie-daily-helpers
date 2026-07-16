import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index/index': 'src/index.ts',
    'is/index': 'src/is.ts',
    'logger/index': 'src/logger.ts',
  },
  outDir: 'dist',
  dts: {
    // 核心：让 tsup 在生成 dts 时，覆盖掉 composite 限制
    compilerOptions: {
      composite: false,
    },
  },
  format: ['esm', 'cjs'],
  splitting: false,
  sourcemap: false,
  clean: true,
});
