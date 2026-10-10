// @ratscript/runtime/builtins/Union.js
// a list of allowed values or patterns: new Union('idle', 'loading', 'done'), new Union(String, Number)

import { is } from './../helpers/is.js';

export default class Union {

  #members;

  constructor (...members) {
    this.#members = Object.freeze(members);
  }

  get members () { return this.#members; }

  has (value) {
    return this.#members.some(member => is(value, member));
  }

  assert (value) {
    if (!this.has(value)) throw new TypeError(`${String(value)} is not one of ${this}`);
    return value;
  }

  toString () {
    return this.#members.map(member => typeof member === 'function' ? member.name : JSON.stringify(member)).join(' | ');
  }

  // value instanceof union
  [Symbol.hasInstance] (value) {
    return this.has(value);
  }

  static isUnion (value) {
    return value !== null && typeof value === 'object' && #members in value;
  }
}
