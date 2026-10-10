// @ratscript/compiler/transforms/literals.js
// #[...]  #(...)  #{...}  new X of T  and the `as` check for object literals

import { array, call, member, identifier, object } from './../build.js';

function elementsOf (node, context) {
  for (const element of node.elements) if (element === null) context.error('holes are not allowed in ratscript literals', node);
  return array(node.elements, node);
}

const from = (context, name, argument, node) => call(member(context.builtin(name), identifier('from')), [argument], node);

export default {

  ObjectExpression (node, parent, key, context) {
    const renamed = node.properties.find(prop => prop.rsAs);
    if (renamed) context.error("'as' renames only in destructuring, use 'key: value' in object literals", renamed);
  },

  RsListExpression (node, parent, key, context) {
    return from(context, 'List', elementsOf(node, context), node);
  },

  RsRecordExpression (node, parent, key, context) {
    const renamed = node.properties.find(prop => prop.rsAs);
    if (renamed) context.error("'as' renames only in destructuring", renamed);
    return from(context, 'Record', object(node.properties, node), node);
  },

  RsTupleExpression (node, parent, key, context) {
    return from(context, 'Tuple', elementsOf(node, context), node);
  },

  // new List of String ('a', 'b')  ->  typed(List, String, ['a', 'b'])
  RsTypedNewExpression (node, parent, key, context) {
    return call(context.helper('typed'), [node.callee, node.rsType, array(node.arguments)], node);
  },
};
