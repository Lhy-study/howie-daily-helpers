/**
 * 测试脚本：向 Worker 发送问题并以 SSE 格式打印流式回答
 *
 * 用法：
 *   1. 先启动 Worker: cd ai/worker && npx wrangler dev
 *   2. 再运行本脚本: tsx scripts/test.ts [问题]
 *
 * 示例：
 *   tsx scripts/test.ts "isNumber 函数怎么用？"
 */

const WORKER_URL = process.env.WORKER_URL || 'http://127.0.0.1:8787';
const question = process.argv[2] || '这个异步器要怎么使用';

async function main() {
  console.log(`🔗 连接 Worker: ${WORKER_URL}/ask`);
  console.log(`❓ 问题: ${question}\n`);
  console.log('─'.repeat(60));

  const res = await fetch(`${WORKER_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ HTTP ${res.status}: ${err}`);
    process.exit(1);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    console.error('❌ 响应体为空');
    process.exit(1);
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let sourcesShown = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        console.log('\n' + '─'.repeat(60));
        console.log('✅ 完成');
        return;
      }

      try {
        const parsed = JSON.parse(data);

        if (parsed.type === 'error') {
          console.error(`\n❌ LLM 错误: ${parsed.data}`);
          return;
        }

        // 打印引用来源
        if (parsed.type === 'sources' && !sourcesShown) {
          sourcesShown = true;
          console.log('📚 参考来源:');
          for (const s of parsed.data) {
            console.log(`   - ${s.title}  (${s.filePath})`);
          }
          console.log('\n🤖 AI 回答:\n');
        }

        // 流式打印回答内容
        if (parsed.type === 'content') {
          process.stdout.write(parsed.data);
        }
      } catch {
        // 非 JSON 数据跳过
      }
    }
  }

  console.log('\n❌ 流提前结束');
}

main().catch((err) => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
