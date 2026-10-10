// @ratscript/runtime/helpers/call.js
// named arguments: f(1, b: 2)

const names = new WeakMap; // function -> parameter names

// attached by the compiler to every `fn`, survives minification
export function params (fn, list) {
  names.set(fn, list);
  return fn;
}

// :::::: PARAMETER NAMES FROM SOURCE
// fallback for plain javascript functions: reads the parameter list of fn.toString()

function sliceParams (source) {
  // classes: the parameters of the constructor
  if (/^class\b/.test(source)) {
    const match = /\bconstructor\s*\(/.exec(source);
    if (!match) return '';
    source = source.slice(match.index + match[0].length - 1);
  }

  const open = source.indexOf('(');
  const arrow = source.indexOf('=>');
  if (arrow !== -1 && (open === -1 || arrow < open)) return source.slice(0, arrow).trim(); // x => ...
  if (open === -1) return '';

  let depth = 0, quote = null;
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    if (quote) { if (char === '\\') index++; else if (char === quote) quote = null; continue; }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if ('([{'.includes(char)) depth++;
    else if (')]}'.includes(char) && --depth === 0) return source.slice(open + 1, index);
  }
  return '';
}

function splitTopLevel (text) {
  const parts = [];
  let depth = 0, quote = null, current = '';
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quote) { current += char; if (char === '\\') current += text[++index]; else if (char === quote) quote = null; continue; }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if ('([{'.includes(char)) depth++;
    else if (')]}'.includes(char)) depth--;
    else if (char === ',' && depth === 0) { parts.push(current); current = ''; continue; }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

export function paramsOf (fn) {
  if (names.has(fn)) return names.get(fn);

  const list = splitTopLevel(sliceParams(Function.prototype.toString.call(fn)))
    .map(part => /^\s*([A-Za-z_$][\w$]*)\s*(?:=|$)/.exec(part.replace(/\/\*[\s\S]*?\*\//g, ''))?.[1] ?? null);

  names.set(fn, list);
  return list;
}

// :::::: ARGUMENTS

function argumentsFor (fn, positional, named) {
  const list = paramsOf(fn);
  const args = [...positional];

  for (const [name, value] of Object.entries(named)) {
    const index = list.indexOf(name);
    if (index === -1) throw new TypeError(`${fn.name || 'function'}() has no parameter '${name}'`);
    if (index < positional.length) throw new TypeError(`${fn.name || 'function'}() got '${name}' twice`);
    args[index] = value;
  }

  return args;
}

export function call (fn, self, positional, named) {
  if (typeof fn !== 'function') throw new TypeError(`${String(fn)} is not a function`);
  return fn.apply(self, argumentsFor(fn, positional, named));
}

export function callMethod (object, key, positional, named) {
  const fn = object[key];
  if (typeof fn !== 'function') throw new TypeError(`${String(key)} is not a function`);
  return fn.apply(object, argumentsFor(fn, positional, named));
}

export function construct (Class, positional, named) {
  return Reflect.construct(Class, argumentsFor(Class, positional, named));
}
