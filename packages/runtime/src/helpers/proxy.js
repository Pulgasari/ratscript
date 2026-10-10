// @ratscript/runtime/helpers/proxy.js
// target of the `proxy` keyword: a javascript Proxy built from get, set and fn members

const own = (object, key) => object !== undefined && Object.hasOwn(object, key);

// methods of the target run against the target, so Map, Set, Date and private fields keep working.
// functions with an own prototype (classes, plain constructors) stay untouched
function bindTo (target, value, cache) {
  if (typeof value !== 'function' || Object.hasOwn(value, 'prototype')) return value;
  let bound = cache.get(value);
  if (!bound) cache.set(value, bound = value.bind(target));
  return bound;
}

export function proxy (target, { fn, get, set } = {}) {
  const cache = new WeakMap;

  return new Proxy(target, {
    get (target, key, receiver) {
      if (own(get, key)) return get[key].call(receiver);
      if (own(fn, key))  return fn[key];
      return bindTo(target, Reflect.get(target, key), cache);
    },

    has (target, key) {
      return own(get, key) || own(fn, key) || Reflect.has(target, key);
    },

    set (target, key, value, receiver) {
      if (own(set, key)) { set[key].call(receiver, value); return true; }
      if (own(get, key) || own(fn, key)) throw new TypeError(`'${String(key)}' is read-only on this proxy`);
      return Reflect.set(target, key, value);
    },
  });
}
