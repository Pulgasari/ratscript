// @ratscript/runtime/builtins/Tuple.js
// an Array of fixed length (sealed): elements may change, the length may not

import { equals } from './../helpers/is.js';

export default class Tuple extends Array {

  // derived arrays (map, filter, ...) are plain arrays, a sealed tuple could not be filled
  static get [Symbol.species] () { return Array; }

  static from (...args) { return Object.seal(super.from(...args)); }
  static of   (...args) { return Object.seal(super.of(...args)); }

  static isTuple (value) {
    return value instanceof Tuple;
  }

  equals (other) {
    return equals(this, other);
  }

  freeze () {
    return Object.freeze(this);
  }

  toArray () {
    return Array.from(this);
  }

  with (index, value) {
    const items = Array.from(this);
    items[index < 0 ? items.length + index : index] = value;
    return Tuple.from(items);
  }
}
