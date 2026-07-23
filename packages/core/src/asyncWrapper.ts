import { LRUCache } from 'lru-cache';

interface WithRetryOptions<E> {
  /** 最大重试次数 */
  max?: number;
  /** 延迟执行时间（ms），默认 1000ms */
  delay?: number;
  /** 是否开启指数退避（每次重试延迟翻倍），默认 false */
  backoff?: boolean;
  /** 按条件重试 */
  shouldRetry?: (e: E) => boolean;
}

/**
 * 带重试的异步包裹器
 * 默认最大重新执行 3 次，延迟 1000 ms 执行
 */
export function withRetry<
  WithRetryError extends Error = Error,
  Params extends any[] = [],
  Result = any,
>(
  fn: (...args: Params) => Promise<Result>,
  options?: WithRetryOptions<WithRetryError>,
) {
  const { max = 3, delay = 1000, backoff, shouldRetry } = options || {};

  return async (...args: Params): Promise<Result> => {
    // 失败重试次数
    let retryCount = 0;

    async function execute() {
      try {
        const result = await fn(...args);

        return result;
      } catch (error) {
        // 是否需要重试
        const eedRetry =
          typeof shouldRetry === 'function'
            ? shouldRetry(error as WithRetryError)
            : true;
        if (eedRetry && retryCount < max) {
          // 延迟阻塞
          retryCount += 1;

          // 随机抖动
          const randomTime = Math.random() * delay;

          const delayTime = backoff
            ? Math.pow(2, retryCount - 1) * delay
            : delay;
          await new Promise((resolve) =>
            setTimeout(resolve, delayTime + randomTime),
          );

          return await execute();
        }

        throw error;
      }
    }

    return execute();
  };
}


// ============================================================
// 核心要点
// ============================================================
//
// 1. Promise 缓存去重
//    多个调用方同时请求同一个 key 时，共享同一个 Promise，
//    确保远程请求只发起一次，所有调用方拿到相同结果。
//
// 2. TTL 过期机制
//    缓存带过期时间，过期后删除旧条目并重新请求，避免拿到
//    过期数据。注意过期时间要 >= 请求耗时，否则 Promise
//    还没落定缓存就失效了，等于没去重。
//
// 3. 内存泄漏防范
//    Map 只增不减会撑爆内存。每次取缓存时顺带清理已过期
//    的条目，或用 WeakMap / 定时器定期清理。
//
// 4. 失败不缓存
//    Promise reject 时立即从缓存中移除，否则后续调用者会
//    反复拿到一个已失败的 Promise，没有重试机会。
//
// 应用场景：多组件同时挂载请求同一接口、并发下载同一文件

interface Options<Params extends any[]> {
  /** 最大容量 */
  capacity?: number;
  /** 记忆时间 */
  ttl?: number;
  /**  key */
  resolveKey: string | ((...args: Params) => string);
}

/**
 * 创建一个共享异步结果方法
 * 1. Promise 缓存去重多个调用方同时请求同一个 key 时，共享同一个 Promise，确保远程请求只发起一次，所有调用方拿到相同结果。
 * 2. TTL 过期机制： 缓存带过期时间，过期后删除旧条目并重新请求，避免拿到过期数据。注意过期时间要 >= 请求耗时，否则 Promise 还没落定缓存就失效了，等于没去重。
 * 3. 内存泄漏防范：Map 只增不减会撑爆内存。每次取缓存时顺带清理已过期的条目，或用 WeakMap / 定时器定期清理。
 * 4. 失败不缓存 Promise reject 时立即从缓存中移除，否则后续调用者会反复拿到一个已失败的 Promise，没有重试机会。
 * */
export const createSharedAsync = <Params extends any[], Result>(
  fn: (...args: Params) => Promise<Result>,
  options: Options<Params>,
) => {
  const { capacity = 100, ttl = 5, resolveKey } = options || {};
  // 实际缓存的结果
  const cache = new LRUCache<string, Promise<Result>>({ max: capacity, ttl });
  // 等待池
  const pendingMap = new Map<string, Promise<Result>>();

  // 解决同步并发请求问题
  return function (...args: Params): Promise<Result> {
    const key =
      typeof resolveKey === 'function' ? resolveKey(...args) : resolveKey;

    // 已经有一个正在 pending 的请求
    if (pendingMap.has(key)) {
      return pendingMap.get(key)!;
    }

    // 如果有缓存命中，直接返回
    if (cache.get(key)) {
      return cache.get(key) as Promise<Result>;
    }

    let promise: Promise<Result>;
    try {
      promise = fn(...args);
    } catch (syncError) {
      return Promise.reject(syncError);
    }

    // 占坑，在执行异步操作前，将 promise 放入等待池中
    pendingMap.set(key, promise);

    // 真正执行
    promise
      .then(
        (result) => {
          cache.set(key, Promise.resolve(result));
        },
        (error) => {
          // 失败不进行缓存
        },
      )
      .finally(() => {
        pendingMap.delete(key);
      });

    return promise;
  };
};
