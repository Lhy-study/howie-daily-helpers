// packages/howie-daily-helpers/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      // 将覆盖率报告输出到当前子包目录下的 coverage 文件夹
      reportsDirectory: './coverage', 
    },
  },
})