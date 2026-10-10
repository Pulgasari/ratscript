// @ratscript/compiler/transforms/operators.js
// |>  +=  is  ..

import { arrow, assign, call, identifier, keyValue } from './../build.js';

const isPlaceholder = node => node?.type === 'Identifier' && node.name === '_';

// :::::: PIPE
// x |> expr        ->  expr(x)
// x |> f(a, _)     ->  f(a, x)
// x |> f(_, _)     ->  (v => f(v, v))(x)

function pipe (node, context) {
  const { left: value, right: step } = node;
  const target = step.type === 'CallExpression' || step.type === 'NewExpression' ? step : null;
  const slots  = target ? target.arguments.filter(isPlaceholder).length : 0;

  if (slots === 0) return call(step, [value], node);

  if (slots === 1) {
    target.arguments = target.arguments.map(argument => isPlaceholder(argument) ? value : argument);
    return target;
  }

  const temp = identifier(context.unique('value'));
  target.arguments = target.arguments.map(argument => isPlaceholder(argument) ? identifier(temp.name) : argument);
  return call(arrow([temp], target), [value], node);
}

// :::::: ADD-ASSIGN
// a += b       ->  a = add(a, b)
// const a += b ->  append(a, b)          (mutates in place, never reassigns)
// o.k += b     ->  addTo(o, 'k', b)      (object and key evaluated once)

function addAssign (node, context) {
  const { left, right } = node;

  if (left.type === 'Identifier') {
    const kind = context.scope.lookup(left.name);
    if (kind === 'const' || kind === 'import') return call(context.helper('append'), [left, right], node);
    return assign(identifier(left.name, left), call(context.helper('add'), [left, right]), node);
  }

  if (left.type === 'MemberExpression' && left.object.type !== 'Super' && left.property.type !== 'PrivateIdentifier' && !left.optional) {
    return call(context.helper('addTo'), [left.object, keyValue(left.property, left.computed), right], node);
  }

  // super.x, this.#x: evaluated twice, both are side effect free
  return assign(left, call(context.helper('add'), [structuredClone(left), right]), node);
}

// :::::: VISITORS

export default {

  AssignmentExpression (node, parent, key, context) {
    if (node.operator === '+=') return addAssign(node, context);
  },

  BinaryExpression (node, parent, key, context) {
    switch (node.operator) {
      case '|>' : return pipe(node, context);
      case '..' : return call(context.helper('range'), [node.left, node.right], node);
      case 'is' : return call(context.helper('is'),    [node.left, node.right], node);
    }
  },
};
