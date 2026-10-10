// @ratscript/runtime/builtins/Range.js
// inclusive, reusable range of numbers or single characters: 1..10, 'a'..'z', 10..1

const isChar = value => typeof value === 'string' && value.length === 1;

export default class Range {

  #chars;
  #from;
  #step;
  #to;

  // strict: no automatic direction, a range "backwards" is empty
  constructor (from, to, step = null, strict = false) {
    const chars = isChar(from) && isChar(to);
    if (!chars && (typeof from !== 'number' || typeof to !== 'number')) {
      throw new TypeError(`a range needs two numbers or two single characters, got ${typeof from} and ${typeof to}`);
    }

    this.#chars = chars;
    this.#from  = chars ? from.charCodeAt(0) : from;
    this.#to    = chars ? to.charCodeAt(0)   : to;
    this.#step  = step ?? (strict || this.#from <= this.#to ? 1 : -1);

    if (this.#step === 0 || !Number.isFinite(this.#step)) throw new RangeError('the step of a range must be a finite number other than 0');
  }

  get from () { return this.#value(this.#from); }
  get step () { return this.#step; }
  get to   () { return this.#value(this.#to); }

  get length () {
    const span = (this.#to - this.#from) / this.#step;
    return span < 0 ? 0 : Math.floor(span) + 1;
  }

  // membership: numbers anywhere between the bounds, characters by their code
  has (value) {
    const code = this.#chars ? (isChar(value) ? value.charCodeAt(0) : NaN) : value;
    if (typeof code !== 'number') return false;
    const min = Math.min(this.#from, this.#to), max = Math.max(this.#from, this.#to);
    return code >= min && code <= max;
  }

  includes (value) { return this.has(value); }

  toArray () { return [...this]; }

  toString () { return `${this.from}..${this.to}`; }

  * [Symbol.iterator] () {
    const step = this.#step;
    for (let value = this.#from; step > 0 ? value <= this.#to : value >= this.#to; value += step) yield this.#value(value);
  }

  #value (code) {
    return this.#chars ? String.fromCharCode(code) : code;
  }

  static isRange (value) {
    return value instanceof Range;
  }
}
