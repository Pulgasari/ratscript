// @ratscript/compiler/build.js
// estree node builders, positions are taken over from an existing node where given

const at = (node, from) => {
  if (from) { node.start = from.start; node.end = from.end; node.loc = from.loc; }
  return node;
};

export const array      = (elements, from)               => at({ type: 'ArrayExpression', elements }, from);
export const arrow      = (params, body, from)           => at({ type: 'ArrowFunctionExpression', async: false, body, expression: body.type !== 'BlockStatement', generator: false, id: null, params }, from);
export const assign     = (left, right, from)            => at({ type: 'AssignmentExpression', left, operator: '=', right }, from);
export const block      = (body, from)                   => at({ type: 'BlockStatement', body }, from);
export const call       = (callee, args, from)           => at({ type: 'CallExpression', arguments: args, callee, optional: false }, from);
export const declare    = (kind, id, init = null, from)  => at({ type: 'VariableDeclaration', declarations: [{ type: 'VariableDeclarator', id, init }], kind }, from);
export const identifier = (name, from)                   => at({ type: 'Identifier', name }, from);
export const literal    = (value, from)                  => at({ type: 'Literal', value, raw: JSON.stringify(value) }, from);
export const member     = (object, property, computed = false, from) => at({ type: 'MemberExpression', computed, object, optional: false, property }, from);
export const object     = (properties, from)             => at({ type: 'ObjectExpression', properties }, from);
export const statement  = (expression, from)             => at({ type: 'ExpressionStatement', expression }, from);

export const property = (key, value, computed = false) => ({
  type: 'Property', computed, key, kind: 'init', method: false, shorthand: false, value,
});

// a property key as written: identifier, literal or computed expression
export const keyOf = (key, computed) => {
  if (computed) return { key, computed: true };
  if (key.type === 'Identifier') return { key: identifier(key.name, key), computed: false };
  return { key: literal(key.value, key), computed: false };
};

// the key as runtime value: 'name' for identifiers, the expression for computed keys
export const keyValue = (key, computed) => {
  if (computed) return key;
  if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') return literal(key.name, key);
  return literal(key.value, key);
};
