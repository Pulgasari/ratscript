// @ratscript/compiler/transforms/globals.js
// free references to ratscript builtins are imported automatically

import { isReference } from './../walk.js';

export const BUILTINS = new Set(['List', 'Range', 'Record', 'Tuple', 'Union']);
export const REACTIVE = new Set(['$', '$Bool', '$Date', '$Map', '$Number', '$Set', '$String', 'batch', 'computed', 'effect', 'untracked']);

export default {

  Identifier (node, parent, key, context) {
    const { name } = node;
    if (!BUILTINS.has(name) && !REACTIVE.has(name)) return;
    if (!isReference(node, parent, key) || context.scope?.lookup(name)) return;
    context.global(name, REACTIVE.has(name) ? 'reactive' : 'main');
  },
};
