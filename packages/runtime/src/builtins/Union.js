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

function Union (members) { return Object.freeze(members); }
const Union = (members) => Object.freeze(members);
const Union = function (members) { return Object.freeze(members); }

Union.has = function (item) { this.some(member => item === member); }

const is = (v) => (x) => v === x;
Union.has = function (item) { this.some(is(item)); }


// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// Predicate helper function
const is = (v) => (x) => v === x;

function Union (members) {
  const collection = [...members];

  // Attach `has` to the collection object
  Object.defineProperty(collection, 'has', {
    value: function (item) {
      // Return boolean result explicitly
      return this.some(is(item));
      
      // Modern alternative:
      // return this.includes(item);
    },
    enumerable: false // Keep `has` out of element iterations
  });

  return Object.freeze(collection);
}

// Usage:
const PrimaryColors = Union(['red', 'green', 'blue']);

console.log(PrimaryColors.has('red'));   // true
console.log(PrimaryColors.has('yellow'));// false

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function createUnion (members) {
  return Object.freeze(new Set(members));
}

const PrimaryColors = createUnion(['red', 'green', 'blue']);
console.log(PrimaryColors.has('red')); // true

