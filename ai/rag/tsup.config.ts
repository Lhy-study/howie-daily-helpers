import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index/index': 'src/index.ts',
  },
  outDir: 'dist',
  dts: true,
  format: ['esm', 'cjs'],
  splitting: false,
  sourcemap: false,
  clean: true,
});
