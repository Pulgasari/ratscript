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

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// Trennung von Daten und Namespace
// ​Wenn Union als Hilfsmodul dienen soll, übergebe die Instanz explizit:

const Union = {
  create (members) {
    return Object.freeze([...members]);
  },
  has (union, item) {
    return union.includes(item);
  }
};

const PrimaryColors = Union.create(['red', 'green', 'blue']);
console.log(Union.has(PrimaryColors, 'red')); // true

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::

const isInstanceOf = (sth) => (ClassName) => sth instanceof ClassName;
const isSet = (sth) => isInstanceOf (Set);


const Union = {
  // creates a frozen Set from any iterable.
  // utomatically removes duplicates and enables O(1) lookups.
  create (...members) {
    const membersSet = new Set(members);
    return Object.freeze(membersSet);
  },
  
  // utility helper to safely check membership.
  // validates input type before performing lookup.
  has (union, member) {
    return isSet(union) ? union.has(member) : false;
  },

  // merges multiple Union sets into a new frozen Union.
  union (...sets) {
    const unionList = sets.flatMap(Array.from);
    const unionSet  = new Set (unionList);
    return Object.freeze(unionSet);
  }
};

// --- Usage ---

// 1. create immutable unions
// (duplicates like 'red' are automatically removed)
const   PrimaryColors = Union.create('red', 'green', 'blue', 'red');
const SecondaryColors = Union.create('cyan', 'magenta', 'yellow');

// 2. lookups work both directly on the instance and via the namespace
PrimaryColors.has('red');           // -> true  (native Set lookup)
Union.has(PrimaryColors, 'yellow'); // -> false (namespace helper lookup)

// 3. Immutability protection
// PrimaryColors.add('black'); // Throws TypeError in strict mode (Set is frozen)

// 4. Combining sets via namespace helper
const AllColors = Union.union(PrimaryColors, SecondaryColors);
AllColors.has('cyan'); // -> true




