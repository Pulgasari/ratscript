// @ratscript/runtime/helpers/add.js
// the universal `+=`

// strings and numbers as in javascript, containers get the value appended in place
export function add (target, value) {
  if (target === undefined || target === null) return value;

  const type = typeof target;
  if (type === 'string' || type === 'number' || type === 'bigint') return target + value;

  if (Array.isArray(target)) { target.push(value); return target; }
  if (target instanceof Set) { target.add(value); return target; }
  if (target instanceof Map) { mapAdd(target, value); return target; }
  if (type === 'object')     { Object.assign(target, value); return target; }

  return target + value;
}

// map += [key, value]  /  map += otherMap  /  map += { key: value }
function mapAdd (map, value) {
  if (Array.isArray(value) && value.length === 2) { map.set(value[0], value[1]); return; }
  const entries = value instanceof Map ? value : Object.entries(value ?? {});
  for (const [key, entry] of entries) map.set(key, entry);
}

// `+=` on a const binding: only in-place appending is possible
export function append (target, value) {
  if (target === undefined || target === null || typeof target !== 'object' && typeof target !== 'function') {
    throw new TypeError('Assignment to constant variable.');
  }
  return add(target, value);
}

// object[key] += value, with object and key evaluated once
export function addTo (object, key, value) {
  return object[key] = add(object[key], value);
}
