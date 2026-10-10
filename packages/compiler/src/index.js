// @ratscript/compiler
// ratscript source -> acorn (+ ratscript plugin) -> transforms -> astring -> javascript

import { generate } from 'astring';

import { parse }     from './parser.js';
import { transform } from './walk.js';

import functions  from './transforms/functions.js';
import globals    from './transforms/globals.js';
import literals   from './transforms/literals.js';
import operators  from './transforms/operators.js';
import proxy      from './transforms/proxy.js';
import statements from './transforms/statements.js';

const FEATURES = [functions, globals, literals, operators, proxy, statements];

// several features may handle the same node type: the first replacement wins
function mergeVisitors (features) {
  const merged = {};
  for (const feature of features) {
    for (const [type, visitor] of Object.entries(feature)) (merged[type] ??= []).push(visitor);
  }
  for (const [type, visitors] of Object.entries(merged)) {
    merged[type] = (node, parent, key, context) => {
      for (const visitor of visitors) {
        const result = visitor(node, parent, key, context);
        if (result !== undefined && result !== node) return result;
      }
    };
  }
  return merged;
}

const VISITORS = mergeVisitors(FEATURES);

// :::::: CONTEXT

function createContext (options) {
  const imports  = { main: new Map, reactive: new Map }; // local name -> exported name
  const warnings = [];
  let counter = 0;

  const position = node => node?.loc ? `${node.loc.start.line}:${node.loc.start.column + 1}` : '?';

  return {
    imports,
    scope: null,
    warnings,

    // a runtime builtin under a private alias, e.g. List -> _rs_List
    builtin (name) {
      imports.main.set(`_rs_${name}`, name);
      return { type: 'Identifier', name: `_rs_${name}` };
    },

    error (message, node) {
      const error = new SyntaxError(`${message} (${options.filename ?? 'input'}:${position(node)})`);
      error.loc = node?.loc?.start;
      throw error;
    },

    // a free reference to a builtin, imported under its own name
    global (name, from) {
      imports[from].set(name, name);
    },

    // a runtime helper under a private alias, e.g. add -> _rs_add
    helper (name) {
      imports.main.set(`_rs_${name}`, name);
      return { type: 'Identifier', name: `_rs_${name}` };
    },

    unique (base) {
      return `_rs_${base}${++counter}`;
    },

    warn (message, node) {
      warnings.push({ column: node?.loc ? node.loc.start.column + 1 : null, line: node?.loc?.start.line ?? null, message });
    },
  };
}

function importDeclaration (names, source) {
  return {
    type       : 'ImportDeclaration',
    attributes : [],
    source     : { type: 'Literal', value: source, raw: JSON.stringify(source) },
    specifiers : [...names].sort(([a], [b]) => a.localeCompare(b)).map(([local, imported]) => ({
      type     : 'ImportSpecifier',
      imported : { type: 'Identifier', name: imported },
      local    : { type: 'Identifier', name: local },
    })),
  };
}

// :::::: COMPILE

export function compile (source, options = {}) {
  const {
    runtime    = '@ratscript/runtime',
    sourceType = 'module',
  } = options;

  const ast     = parse(source, { sourceType });
  const context = createContext(options);

  transform(ast, VISITORS, context);

  const leftover = JSON.stringify(ast, (key, value) => key === 'loc' ? undefined : value).match(/"type":"(Rs\w+)"/);
  if (leftover) throw new Error(`[ratscript] internal: node ${leftover[1]} was not lowered`);

  const preamble = [];
  if (context.imports.main.size)     preamble.push(importDeclaration(context.imports.main, runtime));
  if (context.imports.reactive.size) preamble.push(importDeclaration(context.imports.reactive, `${runtime}/reactive`));
  if (preamble.length && sourceType !== 'module') throw new SyntaxError('[ratscript] ratscript features need the runtime, which requires sourceType "module"');
  ast.body.unshift(...preamble);

  return {
    code     : generate(ast, { indent: '  ' }),
    warnings : context.warnings,
  };
}

export { parse };
export default compile;
