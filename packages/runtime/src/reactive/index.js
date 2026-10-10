// @ratscript/runtime/reactive
// $(value) makes a value reactive, built on @preact/signals-core

import { batch, computed, effect, signal, untracked } from '@preact/signals-core';

const reactives = new WeakSet;

const track = version => { version.value; };
const bump  = version => { version.value++; };

export const isReactive = value => value !== null && (typeof value === 'object' || typeof value === 'function') && reactives.has(value);

// :::::: VALUES
// a signal with a type check. note: as an object it is always truthy, test `.value`

export class $Value {

  #signal;

  constructor (value) {
    this.#signal = signal(this.check(value));
    reactives.add(this);
  }

  // subclasses narrow the accepted values
  check (value) { return value; }

  get value ()      { return this.#signal.value; }
  set value (value) { this.#signal.value = this.check(value); }

  peek ()          { return this.#signal.peek(); }
  subscribe (fn)   { return this.#signal.subscribe(fn); }
  toJSON ()        { return this.value; }
  toString ()      { return String(this.value); }
  valueOf ()       { return this.value; }

  [Symbol.toPrimitive] (hint) {
    return hint === 'string' ? String(this.value) : this.value;
  }
}

function typedValue (name, type) {
  return class extends $Value {
    static get name () { return name; }
    check (value) {
      if (typeof value !== type) throw new TypeError(`${name} expects a ${type}, got ${typeof value}`);
      return value;
    }
  };
}

export const $Bool   = typedValue('$Bool',   'boolean');
export const $Number = typedValue('$Number', 'number');
export const $String = typedValue('$String', 'string');

// :::::: COLLECTIONS
// one version signal per collection: reads subscribe to it, writes bump it

export class $Map extends Map {

  #version = signal(0);

  constructor (entries) {
    super();
    if (entries) for (const [key, value] of entries) super.set(key, value);
    reactives.add(this);
  }

  get size () { track(this.#version); return super.size; }

  entries ()      { track(this.#version); return super.entries(); }
  forEach (...a)  { track(this.#version); return super.forEach(...a); }
  get (key)       { track(this.#version); return super.get(key); }
  has (key)       { track(this.#version); return super.has(key); }
  keys ()         { track(this.#version); return super.keys(); }
  values ()       { track(this.#version); return super.values(); }
  [Symbol.iterator] () { track(this.#version); return super[Symbol.iterator](); }

  clear ()           { const had = super.size > 0; super.clear(); if (had) bump(this.#version); }
  delete (key)       { const done = super.delete(key); if (done) bump(this.#version); return done; }
  set (key, value)   { super.set(key, value); bump(this.#version); return this; }
}

export class $Set extends Set {

  #version = signal(0);

  constructor (values) {
    super();
    if (values) for (const value of values) super.add(value);
    reactives.add(this);
  }

  get size () { track(this.#version); return super.size; }

  entries ()      { track(this.#version); return super.entries(); }
  forEach (...a)  { track(this.#version); return super.forEach(...a); }
  has (value)     { track(this.#version); return super.has(value); }
  keys ()         { track(this.#version); return super.keys(); }
  values ()       { track(this.#version); return super.values(); }
  [Symbol.iterator] () { track(this.#version); return super[Symbol.iterator](); }

  add (value)     { if (!super.has(value)) { super.add(value); bump(this.#version); } return this; }
  clear ()        { const had = super.size > 0; super.clear(); if (had) bump(this.#version); }
  delete (value)  { const done = super.delete(value); if (done) bump(this.#version); return done; }
}

// :::::: DATE

const dateVersions = new WeakMap;

export class $Date extends Date {
  constructor (...args) {
    super(...args);
    dateVersions.set(this, signal(0));
    reactives.add(this);
  }
}

// every getter and formatter of Date tracks, every setter bumps
for (const name of Object.getOwnPropertyNames(Date.prototype)) {
  if (name === 'constructor') continue;
  const original = Date.prototype[name];
  if (typeof original !== 'function') continue;
  const writes = name.startsWith('set');
  $Date.prototype[name] = function (...args) {
    const version = dateVersions.get(this);
    if (!writes) { track(version); return original.apply(this, args); }
    const result = original.apply(this, args);
    bump(version);
    return result;
  };
}
// Date.prototype[Symbol.toPrimitive] is read-only, so it is defined instead of assigned
Object.defineProperty($Date.prototype, Symbol.toPrimitive, {
  configurable : true,
  value (hint) {
    track(dateVersions.get(this));
    return Date.prototype[Symbol.toPrimitive].call(this, hint);
  },
});

// :::::: OBJECTS AND ARRAYS
// shallow: nested objects stay plain unless they are made reactive themselves

function reactiveObject (target) {
  const version = signal(0);
  const result  = new Proxy(target, {
    deleteProperty (target, key) { const done = Reflect.deleteProperty(target, key); bump(version); return done; },
    get (target, key, receiver) { track(version); return Reflect.get(target, key, receiver); },
    has (target, key)           { track(version); return Reflect.has(target, key); },
    ownKeys (target)            { track(version); return Reflect.ownKeys(target); },
    set (target, key, value, receiver) {
      const previous = target[key];
      const done = Reflect.set(target, key, value, receiver);
      if (!Object.is(previous, value) || key === 'length') bump(version);
      return done;
    },
  });
  reactives.add(result);
  return result;
}

const isPlainObject = value => {
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

// :::::: $

// $('Udo') -> $String, $(new Map) -> $Map, $({ ... }) -> reactive object, $(() => a.value * 2) -> computed
export function $ (value) {
  if (isReactive(value)) return value;

  switch (typeof value) {
    case 'boolean'  : return new $Bool(value);
    case 'function' : return computed(value);
    case 'number'   : return new $Number(value);
    case 'string'   : return new $String(value);
  }

  if (value instanceof Map)  return new $Map(value);
  if (value instanceof Set)  return new $Set(value);
  if (value instanceof Date) return new $Date(value.getTime());
  if (value !== null && typeof value === 'object' && (Array.isArray(value) || isPlainObject(value))) return reactiveObject(value);

  return new $Value(value);
}

export { batch, computed, effect, untracked };
