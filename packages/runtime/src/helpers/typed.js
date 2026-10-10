// @ratscript/runtime/helpers/typed.js
// new Class of Type (...args)  ->  Class.typed(Type, ...args)

export function typed (Class, type, args) {
  if (typeof Class?.typed !== 'function') throw new TypeError(`${Class?.name ?? Class} does not support 'of' typing`);
  return Class.typed(type, ...args);
}
