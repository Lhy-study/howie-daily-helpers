import {
  isString,
  isNumber,
  isBoolean,
  isSymbol,
  isBigInt,
  isUndefined,
  isNull,
  isHttpUrl,
  isPromiseLike,
  hasOwnProperty,
} from '../src/is';
import { expect, test, describe } from 'vitest';

describe('is', () => {
  test('isString', () => {
    expect(isString('hello')).toBe(true);
    expect(isString(123)).toBe(false);
  });

  test('isNumber', () => {
    expect(isNumber('123')).toBe(false);
    expect(isNumber(123)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
  });

  test('isBoolean', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(123)).toBe(false);
  });

  test('isSymbol', () => {
    expect(isSymbol(Symbol('hello'))).toBe(true);
    expect(isSymbol('hello')).toBe(false);
    expect(isSymbol(123)).toBe(false);
    expect(isSymbol(Symbol('hello').description)).toBe(false);
  });

  test('isBigInt', () => {
    expect(isBigInt(123)).toBe(false);
    expect(isBigInt('123')).toBe(false);
    expect(isBigInt(BigInt(123))).toBe(true);
  });

  test('isUndefined', () => {
    expect(isUndefined(undefined)).toBe(true);
    expect(isUndefined(null)).toBe(false);
    expect(isUndefined(123)).toBe(false);
    expect(isUndefined('hello')).toBe(false);
    expect(isUndefined({})).toBe(false);
    expect(isUndefined([])).toBe(false);
    expect(isUndefined(false)).toBe(false);
  });

  test('isNull', () => {
    expect(isNull(null)).toBe(true);
  });

  test('isHttpUrl', () => {
    expect(isHttpUrl('https://www.baidu.com')).toBe(true);
    expect(isHttpUrl('https://www.baidu.com/')).toBe(true);
    expect(isHttpUrl('https://www.baidu.com/123')).toBe(true);
    expect(isHttpUrl('https://www.baidu.com/123/456')).toBe(true);
    expect(isHttpUrl('https://www.baidu.com/123/456?query=param')).toBe(true);
    expect(isHttpUrl('http://www.baidu.com/')).toBe(true);
    expect(isHttpUrl('htt://www.baidu.com/123/456#hash')).toBe(false);
    expect(isHttpUrl('ws://www.baidu.com/123/456#hash')).toBe(false);
    expect(isHttpUrl('123')).toBe(false);
    expect(isHttpUrl({} as unknown as string)).toBe(false);
  });

  test('isPromiseLike', () => {
    const fn = function () {};
    fn.then = function () {};

    const obj = { then: () => {} };
    const proxyObj = new Proxy(obj, {
      get(target, prop) {
        if (prop === 'then') {
          throw new Error('then is not a function');
        }
        return Reflect.get(target, prop);
      },
    });

    expect(isPromiseLike(Promise.resolve())).toBe(true);
    expect(isPromiseLike({ then: () => {} })).toBe(true);
    expect(isPromiseLike(fn)).toBe(true);
    expect(isPromiseLike({})).toBe(false);
    expect(isPromiseLike([])).toBe(false);
    expect(isPromiseLike(false)).toBe(false);
    expect(isPromiseLike(true)).toBe(false);
    expect(isPromiseLike('hello')).toBe(false);
    expect(isPromiseLike(obj)).toBe(true);
    expect(isPromiseLike(proxyObj)).toBe(false);
    expect(isPromiseLike(123)).toBe(false);
  });

  test('isNaN', () => {
    expect(isNaN(NaN)).toBe(true);
    expect(isNaN(123)).toBe(false);
  });

  test('hasOwnProperty', () => {
    const obj = { a: 1, b: 2 };
    const nullObj = null;
    expect(hasOwnProperty(obj, 'a')).toBe(true);
    expect(hasOwnProperty(obj, 'b')).toBe(true);
    expect(hasOwnProperty(obj, 'c')).toBe(false);
    expect(hasOwnProperty(obj, [] as unknown as string)).toBe(false);
    expect(hasOwnProperty(nullObj as unknown as object, 'a')).toBe(false);
  });
});
