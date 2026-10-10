// @ratscript/runtime/builtins/Record.js
// an object of fixed shape (sealed): values may change, keys may not be added or removed.
// methods live on the prototype, a key of the same name hides them

import { equals } from './../helpers/is.js';

export default class Record {

  static from (object) {
    return Object.seal(Object.assign(new Record, object));
  }

  static isRecord (value) {
    return value instanceof Record;
  }

  equals (other) {
    return equals(this, other);
  }

  freeze () {
    return Object.freeze(this);
  }

  keys () {
    return Object.keys(this);
  }

  toObject () {
    return { ...this };
  }

  // a copy with changed (or added) keys
  with (changes) {
    return Record.from({ ...this, ...changes });
  }
}
