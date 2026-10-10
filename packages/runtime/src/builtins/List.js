// @ratscript/runtime/builtins/List.js
// an Array with extras. mutating methods have a non-mutating `toX` counterpart.
// typed lists check every inserted element against an `is` pattern: new List of String

import { equals, is } from './../helpers/is.js';

export default class List extends Array {

  // the element pattern of a typed list, null for untyped
  #type = null;

  // same signature as Array, so species construction (map, filter, ...) keeps working
  constructor (...args) {
    super(...args);
  }

  static typed (type, ...items) {
    const list = new this;
    list.#type = type;
    list.push(...items);
    return list;
  }

  static isList (value) {
    return value instanceof List;
  }

  get type () { return this.#type; }

  get first () { return this[0]; }
  get last  () { return this[this.length - 1]; }

  // :::::: TYPE CHECK

  #check (items) {
    if (this.#type === null) return;
    for (const item of items) {
      if (!is(item, this.#type)) throw new TypeError(`list of ${this.#type?.name ?? String(this.#type)} cannot hold ${typeof item === 'string' ? `'${item}'` : String(item)}`);
    }
  }

  // :::::: MUTATING (checked)

  fill (value, start, end) { this.#check([value]); return super.fill(value, start, end); }
  push (...items)          { this.#check(items);   return super.push(...items); }
  unshift (...items)       { this.#check(items);   return super.unshift(...items); }

  splice (start, deleteCount, ...items) {
    this.#check(items);
    return arguments.length < 2 ? super.splice(start) : super.splice(start, deleteCount, ...items);
  }

  set (index, value) {
    this.#check([value]);
    this[index < 0 ? this.length + index : index] = value;
    return this;
  }

  // :::::: MUTATING (extras)

  clear () {
    this.length = 0;
    return this;
  }

  remove (...values) {
    for (const value of values) {
      const index = this.indexOf(value);
      if (index !== -1) super.splice(index, 1);
    }
    return this;
  }

  removeAt (index) {
    super.splice(index, 1);
    return this;
  }

  shuffle () {
    for (let index = this.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [this[index], this[other]] = [this[other], this[index]];
    }
    return this;
  }

  unique () {
    const seen = new Set;
    let write = 0;
    for (const value of this) if (!seen.has(value)) { seen.add(value); this[write++] = value; }
    this.length = write;
    return this;
  }

  // :::::: NON-MUTATING

  clone () {
    const copy = new this.constructor;
    copy.#type = this.#type;
    Array.prototype.push.apply(copy, this);
    return copy;
  }

  toRemoved   (...values)     { return this.clone().remove(...values); }
  toRemovedAt (index)         { return this.clone().removeAt(index); }
  toReversed  ()              { return this.clone().reverse(); }
  toShuffled  ()              { return this.clone().shuffle(); }
  toSorted    (compare)       { return this.clone().sort(compare); }
  toSpliced   (...args)       { const copy = this.clone(); copy.splice(...args); return copy; }
  toUnique    ()              { return this.clone().unique(); }
  with        (index, value)  { return this.clone().set(index, value); }

  // :::::: QUERY

  equals (other) {
    return equals(this, other);
  }

  groupBy (fn) {
    const groups = new Map;
    for (const value of this) {
      const key = fn(value);
      if (!groups.has(key)) groups.set(key, this.#empty());
      Array.prototype.push.call(groups.get(key), value);
    }
    return groups;
  }

  zip (other) {
    const length = Math.min(this.length, other.length);
    return List.from({ length }, (_, index) => [this[index], other[index]]);
  }

  toArray () {
    return Array.from(this);
  }

  #empty () {
    const list = new this.constructor;
    list.#type = this.#type;
    return list;
  }
}
