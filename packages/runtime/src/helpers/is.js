// @ratscript/runtime/helpers/is.js
// `value is pattern` and structural equality

import List   from './../builtins/List.js';
import Range  from './../builtins/Range.js';
import Record from './../builtins/Record.js';
import Tuple  from './../builtins/Tuple.js';
import Union  from './../builtins/Union.js';

// constructors that stand for a primitive type
const TYPES = new Map([
  [Array,    value => Array.isArray(value)],
  [BigInt,   value => typeof value === 'bigint'],
  [Boolean,  value => typeof value === 'boolean'],
  [Function, value => typeof value === 'function'],
  [Number,   value => typeof value === 'number'],
  [Object,   value => value !== null && typeof value === 'object' && !Array.isArray(value)],
  [String,   value => typeof value === 'string'],
  [Symbol,   value => typeof value === 'symbol'],
]);

const isClass       = fn => /^class\b/.test(Function.prototype.toString.call(fn));
const isPlainObject = value => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

// :::::: IS
// constructor   String, Number, ...      -> type check
// class         User                     -> instanceof
// function      v => v > 0               -> predicate
// regexp        /^a/                     -> string matches
// union, range                            -> membership
// list, tuple, record                     -> structural equality
// array         [String, Number]          -> positional shape
// object        { name: String }          -> shape, nested patterns
// anything else                           -> Object.is

export function is (value, pattern) {
  if (Object.is(value, pattern)) return true;
  if (pattern === null || pattern === undefined) return false;

  if (typeof pattern === 'function') {
    if (TYPES.has(pattern)) return TYPES.get(pattern)(value);
    if (Object.hasOwn(pattern, Symbol.hasInstance) || isClass(pattern)) return value instanceof pattern;
    if (pattern.prototype && value !== null && typeof value === 'object' && value instanceof pattern) return true;
    return Boolean(pattern(value));
  }

  if (typeof pattern !== 'object') return false;

  if (pattern instanceof RegExp) {
    pattern.lastIndex = 0;
    return typeof value === 'string' && pattern.test(value);
  }
  if (pattern instanceof Union || pattern instanceof Range) return pattern.has(value);
  if (List.isList(pattern) || Tuple.isTuple(pattern) || Record.isRecord(pattern)) return equals(value, pattern);

  if (Array.isArray(pattern)) {
    if (!Array.isArray(value) || value.length !== pattern.length) return false;
    return pattern.every((item, index) => is(value[index], item));
  }

  if (value === null || typeof value !== 'object' && typeof value !== 'function') return false;
  return Object.keys(pattern).every(key => is(value[key], pattern[key]));
}

// :::::: EQUALS
// deep, structural: arrays, lists, tuples, records, plain objects, maps, sets, dates

export function equals (a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length || a.constructor !== b.constructor) return false;
    return a.every((item, index) => equals(item, b[index]));
  }

  if (a instanceof Date) return b instanceof Date && a.getTime() === b.getTime();

  if (a instanceof Map) {
    if (!(b instanceof Map) || a.size !== b.size) return false;
    for (const [key, value] of a) if (!b.has(key) || !equals(value, b.get(key))) return false;
    return true;
  }

  if (a instanceof Set) {
    if (!(b instanceof Set) || a.size !== b.size) return false;
    for (const value of a) if (!b.has(value)) return false;
    return true;
  }

  const isStructured = value => isPlainObject(value) || Record.isRecord(value);
  if (!isStructured(a) || !isStructured(b) || Record.isRecord(a) !== Record.isRecord(b)) return false;

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(key => Object.hasOwn(b, key) && equals(a[key], b[key]));
}
