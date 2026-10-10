// @ratscript/compiler/transforms/statements.js
// naked loops, keyword-less loop bindings, silent try

import { block, call, declare, identifier } from './../build.js';

// iterables that never need the number-to-range conversion
const OBVIOUS_ITERABLES = new Set(['ArrayExpression', 'RsListExpression', 'RsTupleExpression', 'TemplateLiteral']);

const needsIter = node => !OBVIOUS_ITERABLES.has(node.type) && !(node.type === 'BinaryExpression' && node.operator === '..');

export default {

  // for (name of x)  ->  for (let name of x), always a fresh binding
  'enter:ForOfStatement' (node, parent, key, context) {
    if (node.left.type === 'Identifier') {
      const { name } = node.left;
      if (context.scope?.lookup(name)) {
        context.warn(`loop variable '${name}' shadows an outer '${name}', ratscript always binds a fresh let here`, node.left);
      }
      node.left = declare('let', node.left, null, node.left);
    }
    node.rsIter = needsIter(node.right);
  },

  // for (const x of 10) iterates 1..10
  ForOfStatement (node, parent, key, context) {
    if (node.rsIter) node.right = call(context.helper('iter'), [node.right], node.right);
  },

  // for (10) {}  /  for (1..10) {}  /  for (list) {}
  RsNakedFor (node, parent, key, context) {
    return {
      type  : 'ForOfStatement',
      await : false,
      body  : node.body,
      left  : declare('const', identifier(context.unique('step'))),
      right : call(context.helper('iter'), [node.iterable], node.iterable),
      start : node.start, end: node.end, loc: node.loc,
    };
  },

  // a lone try fails silently
  TryStatement (node) {
    if (node.rsSilent) node.handler = { type: 'CatchClause', param: null, body: block([]) };
  },
};
