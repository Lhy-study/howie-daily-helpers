// 基础类型
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNumber = (val: unknown): val is number => typeof val === 'number' && !isNaN(val);
export const isBoolean = (val: unknown): val is boolean => typeof val === 'boolean';
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol';
export const isBigInt = (val: unknown): val is bigint => typeof val === 'bigint';
export const isUndefined = (val: unknown): val is undefined => val === undefined;
export const isNull = (val: unknown): val is null => val === null;

/** 检查字符串是否为 URL 格式 */
export function isHttpUrl(url: string) {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * 检查是否满足 Promise A+ 规范
 * https://promisesaplus.com/#point-3
 */
export function isPromiseLike(value: any): value is PromiseLike<any> {
  if (
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  )
    return false;
  // 防止触发 getter 报错
  try {
    return typeof value.then === 'function';
  } catch (error) {
    return false;
  }
}

/** 判断一个值是否为 NaN */
export function isNaN(value: any): value is number {
  return Object.is(value, NaN);
}

/** 判断一个对象是否包含某个属性 */
export function hasOwnProperty(obj: object, prop: string): boolean {
  if (obj === null) return false;
  if (typeof obj !== 'object') return false;
  return prop in obj;
}