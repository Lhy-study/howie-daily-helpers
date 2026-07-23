import { describe, expect, test, vi } from 'vitest';
import { withRetry, createSharedAsync } from '../src/asyncWrapper';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('withRetry', () => {
  test('首次成功时不重试，直接返回结果', async () => {
    const fn = vi.fn(async () => 'success');
    const retryFn = withRetry(fn, { max: 3, delay: 10 });
    const result = await retryFn();
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('失败后重试，最终成功时返回结果', async () => {
    let count = 0;
    const fn = vi.fn(async () => {
      count += 1;
      if (count < 3) throw new Error('fail');
      return 'success';
    });
    const retryFn = withRetry(fn, { max: 3, delay: 10 });
    const result = await retryFn();
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('超过最大重试次数后抛出错误', async () => {
    const fn = vi.fn(async () => {
      throw new Error('always fail');
    });
    const retryFn = withRetry(fn, { max: 2, delay: 10 });
    await expect(retryFn()).rejects.toThrow('always fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('shouldRetry 返回 false 时不重试', async () => {
    const fn = vi.fn(async () => {
      throw new Error('special error');
    });
    const retryFn = withRetry(fn, {
      max: 3,
      delay: 10,
      shouldRetry: (e) => e.message !== 'special error',
    });
    await expect(retryFn()).rejects.toThrow('special error');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('backoff 开启时延迟递增', async () => {
    const fn = vi.fn(async () => {
      throw new Error('fail');
    });
    const startTime = Date.now();
    const retryFn = withRetry(fn, { max: 2, delay: 10, backoff: true });
    await expect(retryFn()).rejects.toThrow('fail');
    const elapsed = Date.now() - startTime;
    expect(fn).toHaveBeenCalledTimes(3);
    expect(elapsed).toBeGreaterThanOrEqual(30);
  });

  test('传递参数正确', async () => {
    const fn = vi.fn(async (a: number, b: string) => `${a}-${b}`);
    const retryFn = withRetry(fn, { max: 3, delay: 10 });
    const result = await retryFn(42, 'hello');
    expect(result).toBe('42-hello');
    expect(fn).toHaveBeenCalledWith(42, 'hello');
  });

  test('默认参数正常工作', async () => {
    const fn = vi.fn(async () => 'ok');
    const retryFn = withRetry(fn);
    const result = await retryFn();
    expect(result).toBe('ok');
  });
});

describe('createSharedAsync', () => {
  test('相同 key 的并发请求共享同一个 Promise', async () => {
    let callCount = 0;
    const fn = vi.fn(async (id: number) => {
      callCount += 1;
      await delay(20);
      return `result-${id}`;
    });

    const sharedFn = createSharedAsync(fn, {
      resolveKey: (id) => `key-${id}`,
      capacity: 10,
      ttl: 1000,
    });

    const [r1, r2, r3] = await Promise.all([
      sharedFn(1),
      sharedFn(1),
      sharedFn(1),
    ]);

    expect(r1).toBe('result-1');
    expect(r2).toBe('result-1');
    expect(r3).toBe('result-1');
    expect(callCount).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('不同 key 的请求独立执行', async () => {
    let callCount = 0;
    const fn = vi.fn(async (id: number) => {
      callCount += 1;
      await delay(10);
      return `result-${id}`;
    });

    const sharedFn = createSharedAsync(fn, {
      resolveKey: (id) => `key-${id}`,
      capacity: 10,
      ttl: 1000,
    });

    const [r1, r2] = await Promise.all([sharedFn(1), sharedFn(2)]);

    expect(r1).toBe('result-1');
    expect(r2).toBe('result-2');
    expect(callCount).toBe(2);
  });

  test('缓存命中时直接返回缓存结果', async () => {
    let callCount = 0;
    const fn = vi.fn(async (id: number) => {
      callCount += 1;
      return `result-${id}`;
    });

    const sharedFn = createSharedAsync(fn, {
      resolveKey: (id) => `key-${id}`,
      capacity: 10,
      ttl: 1000,
    });

    const r1 = await sharedFn(1);
    const r2 = await sharedFn(1);

    expect(r1).toBe('result-1');
    expect(r2).toBe('result-1');
    expect(callCount).toBe(1);
  });

  test('失败不缓存，后续请求可重试', async () => {
    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount += 1;
      throw new Error(`fail-${callCount}`);
    });

    const sharedFn = createSharedAsync(fn, {
      resolveKey: 'fixed-key',
      capacity: 10,
      ttl: 1000,
    });

    await expect(sharedFn()).rejects.toThrow('fail-1');
    await expect(sharedFn()).rejects.toThrow('fail-2');
    expect(callCount).toBe(2);
  });

  test('TTL 过期后重新请求', async () => {
    let callCount = 0;
    const fn = vi.fn(async () => {
      callCount += 1;
      return `result-${callCount}`;
    });

    const sharedFn = createSharedAsync(fn, {
      resolveKey: 'fixed-key',
      capacity: 10,
      ttl: 10,
    });

    const r1 = await sharedFn();
    expect(r1).toBe('result-1');
    expect(callCount).toBe(1);

    await delay(50);

    const r2 = await sharedFn();
    expect(r2).toBe('result-2');
    expect(callCount).toBe(2);
  });

  test('resolveKey 支持字符串', async () => {
    const fn = vi.fn(async () => 'fixed-result');
    const sharedFn = createSharedAsync(fn, {
      resolveKey: 'static-key',
      capacity: 10,
      ttl: 1000,
    });

    const r1 = await sharedFn();
    const r2 = await sharedFn();
    expect(r1).toBe('fixed-result');
    expect(r2).toBe('fixed-result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('同步抛出错误时正确处理', async () => {
    const fn = vi.fn(() => {
      throw new Error('sync error');
    });

    const sharedFn = createSharedAsync(fn as unknown as () => Promise<string>, {
      resolveKey: 'sync-key',
      capacity: 10,
      ttl: 1000,
    });

    await expect(sharedFn()).rejects.toThrow('sync error');
  });

  test('超出容量时 LRU 淘汰旧缓存', async () => {
    const fn = vi.fn(async (id: number) => `result-${id}`);

    const sharedFn = createSharedAsync(fn, {
      resolveKey: (id) => `key-${id}`,
      capacity: 2,
      ttl: 1000,
    });

    await sharedFn(1);
    await sharedFn(2);
    await sharedFn(3);

    expect(fn).toHaveBeenCalledTimes(3);

    await sharedFn(2);
    expect(fn).toHaveBeenCalledTimes(3);

    await sharedFn(1);
    expect(fn).toHaveBeenCalledTimes(4);
  });
});
