// @ratscript/runtime/helpers/iter.js
// range literal and loop sources

import Range from './../builtins/Range.js';

// from..to
export const range = (from, to) => new Range(from, to);

// for (10) / for (x of 10): a number n iterates 1..n
export function iter (source) {
  if (typeof source === 'number') {
    if (!Number.isInteger(source) || source < 0) throw new RangeError(`cannot loop ${source} times`);
    return new Range(1, source, 1, true);
  }
  return source;
}
