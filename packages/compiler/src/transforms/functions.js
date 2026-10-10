// @ratscript/compiler/transforms/functions.js
// fn metadata for named arguments, calls with named arguments

import { array, call, identifier, keyValue, literal, object, property, statement } from './../build.js';

// :::::: PARAMETER NAMES
// kept at compile time, so named arguments survive minification

function paramNames (fn) {
  return fn.params.map(param => {
    if (param.type === 'Identifier') return param.name;
    if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') return param.left.name;
    return null; // destructured or rest: positional only
  });
}

const paramsList = fn => array(paramNames(fn).map(name => literal(name)));
const hasNames   = fn => paramNames(fn).some(Boolean);

// :::::: NAMED CALLS
// f(1, b: 2)         ->  call(f, undefined, [1], { b: 2 })
// o.m(b: 2)          ->  callMethod(o, 'm', [], { b: 2 })
// new C(b: 2)        ->  construct(C, [], { b: 2 })

function splitArguments (args) {
  const positional = [], named = [];
  for (const argument of args) {
    if (argument.type === 'RsNamedArgument') named.push(property(identifier(argument.name.name, argument.name), argument.value));
    else positional.push(argument);
  }
  return { named: object(named), positional: array(positional) };
}

const hasNamed = node => node.arguments.some(argument => argument.type === 'RsNamedArgument');

// :::::: VISITORS

export default {

  CallExpression (node, parent, key, context) {
    if (!hasNamed(node)) return;
    if (node.optional) context.error('named arguments are not supported in optional calls', node);

    const { named, positional } = splitArguments(node.arguments);
    const { callee } = node;

    if (callee.type === 'Super') context.error('named arguments are not supported in super calls', node);

    if (callee.type === 'MemberExpression' && callee.object.type !== 'Super' && callee.property.type !== 'PrivateIdentifier') {
      return call(context.helper('callMethod'), [callee.object, keyValue(callee.property, callee.computed), positional, named], node);
    }

    const self = callee.type === 'MemberExpression' ? { type: 'ThisExpression' } : identifier('undefined');
    return call(context.helper('call'), [callee, self, positional, named], node);
  },

  ExportNamedDeclaration (node, parent, key, context) {
    const fn = node.declaration;
    if (fn?.type !== 'FunctionDeclaration' || !fn.rsFn || !hasNames(fn) || !Array.isArray(parent?.[key])) return;
    return [node, statement(call(context.helper('params'), [identifier(fn.id.name), paramsList(fn)]))];
  },

  FunctionDeclaration (node, parent, key, context) {
    if (!node.rsFn || !hasNames(node) || !Array.isArray(parent?.[key])) return;
    return [node, statement(call(context.helper('params'), [identifier(node.id.name), paramsList(node)]))];
  },

  FunctionExpression (node, parent, key, context) {
    if (!node.rsFn || !hasNames(node)) return;
    return call(context.helper('params'), [node, paramsList(node)], node);
  },

  NewExpression (node, parent, key, context) {
    if (!hasNamed(node)) return;
    const { named, positional } = splitArguments(node.arguments);
    return call(context.helper('construct'), [node.callee, positional, named], node);
  },

  RsNamedArgument (node, parent, key, context) {
    if (parent?.type !== 'CallExpression' && parent?.type !== 'NewExpression') context.error('named arguments are only allowed in calls', node);
  },
};
