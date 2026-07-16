---
title: 类型判断工具 is
description: 一组基础类型守卫与值校验工具函数，用于运行时类型收窄与安全校验。
---

# 类型判断工具 `is`

<Badge type="tip" text="TypeScript" />
<Badge type="info" text="Type Guard" />

一组轻量的基础类型判断工具，主要用于**运行时类型守卫（type guard）**与**值校验**。所有类型判断函数均为 TypeScript 类型谓词（`val is T`），可在条件分支中实现自动类型收窄。

## 基础类型

以下函数对 `unknown` 入参进行类型判断，返回类型谓词：

| 函数 | 签名 | 说明 |
| --- | --- | --- |
| `isString` | `(val: unknown) => val is string` | 是否为字符串 |
| `isNumber` | `(val: unknown) => val is number` | 是否为数字（**排除 `NaN`**） |
| `isBoolean` | `(val: unknown) => val is boolean` | 是否为布尔值 |
| `isSymbol` | `(val: unknown) => val is symbol` | 是否为 `symbol` |
| `isBigInt` | `(val: unknown) => val is bigint` | 是否为 `bigint` |
| `isUndefined` | `(val: unknown) => val is undefined` | 是否为 `undefined` |
| `isNull` | `(val: unknown) => val is null` | 是否为 `null` |

### 示例

```ts
import { isString, isNumber, isNull } from './is';

function handle(val: unknown): string {
  if (isString(val)) {
    // val 已被收窄为 string
    return val.toUpperCase();
  }

  if (isNumber(val)) {
    // val 为 number，且一定不是 NaN
    return val.toFixed(2);
  }

  if (isNull(val)) {
    // val 已收窄为 null
    return 'null';
  }

  return 'unknown';
}
```

::: tip 关于 `isNumber`
`isNumber` 内部等价于 `typeof val === 'number' && !isNaN(val)`，因此 `NaN` 会返回 `false`。若需要精确识别 `NaN`，请使用 [`isNaN`](#isnan)。
:::

## `isHttpUrl`

检查字符串是否为合法的 `http` / `https` URL。

- 入参非字符串时直接返回 `false`
- 通过 `new URL()` 解析，要求协议为 `http:` 或 `https:`

```ts
import { isHttpUrl } from './is';

isHttpUrl('https://example.com');        // true
isHttpUrl('http://example.com/path');    // true
isHttpUrl('ftp://example.com');          // false
isHttpUrl('not-a-url');                  // false
isHttpUrl(123 as unknown as string);     // false
```

## `isPromiseLike`

检查一个值是否为「类 Promise 对象」（thenable），符合 [Promise A+ 规范](https://promisesaplus.com/#point-3) 的定义：拥有可调用的 `then` 方法。

```ts
import { isPromiseLike } from './is';

isPromiseLike(Promise.resolve(1));   // true
isPromiseLike({ then: () => {} });   // true
isPromiseLike(null);                 // false
isPromiseLike({});                   // false
```

::: warning 防止 getter 报错
实现上通过 `try/catch` 包裹对 `value.then` 的访问，避免对象上 `then` 为抛出异常的 getter 时导致崩溃。
:::

## `isNaN`

基于 `Object.is` 精确判断一个值是否严格等于 `NaN`。

```ts
import { isNaN } from './is';

isNaN(NaN);                    // true
isNaN(Number('abc'));          // true
isNaN(0);                      // false

// 与全局 isNaN 不同，不会进行隐式类型转换
isNaN('abc' as unknown as number); // false
```

::: details 与全局 `isNaN` 的区别
全局 `isNaN` 会先对入参做隐式 `Number()` 转换，因此 `isNaN('abc')` 返回 `true`；而本函数基于 `Object.is(value, NaN)`，不做转换，`isNaN('abc')` 返回 `false`，行为更接近 `Number.isNaN`。
:::

## `hasOwnProperty`

判断对象是否包含某个属性（基于 `in` 运算符，会检查原型链），并对非对象 / `null` 入参做了防御。

```ts
import { hasOwnProperty } from './is';

hasOwnProperty({ a: 1 }, 'a');        // true
hasOwnProperty({ a: 1 }, 'b');        // false
hasOwnProperty(null, 'a');            // false
hasOwnProperty(42 as object, 'a');    // false
```

## 导出总览

```ts
export const isString: (val: unknown) => val is string;
export const isNumber: (val: unknown) => val is number;
export const isBoolean: (val: unknown) => val is boolean;
export const isSymbol: (val: unknown) => val is symbol;
export const isBigInt: (val: unknown) => val is bigint;
export const isUndefined: (val: unknown) => val is undefined;
export const isNull: (val: unknown) => val is null;

export function isHttpUrl(url: string): boolean;
export function isPromiseLike(value: any): value is PromiseLike<any>;
export function isNaN(value: any): value is number;
export function hasOwnProperty(obj: object, prop: string): boolean;
```
