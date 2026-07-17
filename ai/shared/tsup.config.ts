import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/config.ts'],
  outDir: 'dist',
  dts: true,
  format: ['esm', 'cjs'],
  splitting: false,
  sourcemap: false,
  clean: true,
});
