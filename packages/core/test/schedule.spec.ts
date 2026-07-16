import { describe, expect, test, vi } from 'vitest';
import { AsyncTaskScheduler } from '../src/asyncTaskScheduler';

/** 占用 ms 毫秒后才 resolve 的异步任务 */
function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('AsyncTaskScheduler', () => {
  test('addTask 返回结果正确', async () => {
    const scheduler = new AsyncTaskScheduler({ maxConcurrency: 2 });
    const task1 = scheduler.addTask(() => Promise.resolve(1));
    const task2 = scheduler.addTask(() => Promise.resolve(2));
    const result = await Promise.all([task1, task2]);
    expect(result).toEqual([1, 2]);
  });

  test('并发数被限制在 maxConcurrency 以内', async () => {
    const maxConcurrency = 3;
    const scheduler = new AsyncTaskScheduler({ maxConcurrency });

    let running = 0;
    let maxRunning = 0;

    // 用 vi.fn 记录每个任务生命周期，实时统计当前并发数
    const track = vi.fn(async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await delay(20); // 故意占用一段时间，制造并发重叠窗口
      running -= 1;
    });

    const tasks = Array.from({ length: 10 }, () => scheduler.addTask(track));
    await Promise.all(tasks);

    // 断言：观测到的最大并发数不超过配置值，且确实是并发执行的（>1）
    expect(maxRunning).toBeLessThanOrEqual(maxConcurrency);
    expect(maxRunning).toBeGreaterThan(1);
    expect(track).toHaveBeenCalledTimes(10);
  });

  test('maxConcurrency=1 时任务严格串行', async () => {
    const scheduler = new AsyncTaskScheduler({ maxConcurrency: 1 });

    let running = 0;
    let maxRunning = 0;
    const order: number[] = [];

    const track = vi.fn(async (id: number) => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      order.push(id); // 进入时记录顺序
      await delay(10);
      running -= 1;
    });

    const tasks = Array.from({ length: 5 }, (_, i) =>
      scheduler.addTask(() => track(i)),
    );
    await Promise.all(tasks);

    // 严格串行：任意时刻最多 1 个任务在跑
    expect(maxRunning).toBe(1);
    expect(order).toEqual([0, 1, 2, 3, 4]); // FIFO 顺序执行
  });

  test('全部任务完成后触发 onAllFinish', async () => {
    const onAllFinish = vi.fn();
    const scheduler = new AsyncTaskScheduler({ maxConcurrency: 2, onAllFinish });

    const tasks = Array.from({ length: 4 }, () =>
      scheduler.addTask(() => delay(10)),
    );
    await Promise.all(tasks);

    expect(onAllFinish).toHaveBeenCalledTimes(1);
  });

  test('单个任务失败不影响其他任务', async () => {
    const scheduler = new AsyncTaskScheduler({ maxConcurrency: 2 });

    const ok = vi.fn(async () => {
      await delay(10);
      return 'ok';
    });
    const bad = vi.fn(async () => {
      await delay(10);
      throw new Error('boom');
    });

    const results = await Promise.allSettled([
      scheduler.addTask(ok),
      scheduler.addTask(bad),
      scheduler.addTask(ok),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('fulfilled');
    expect(ok).toHaveBeenCalledTimes(2);
  });
});
