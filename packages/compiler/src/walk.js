// @ratscript/compiler/walk.js
// post-order tree transform with scope tracking. visitors may replace nodes by returning them

import { Scope, collectHoisted, collectStatements, isFunctionNode, namesOf } from './scope.js';

const SKIP_KEYS = new Set(['loc', 'start', 'end', 'type', 'range']);

// identifier positions that are not references
export function isReference (node, parent, key) {
  if (!parent) return true;
  switch (parent.type) {
    case 'ExportSpecifier'   : return key === 'local';
    case 'ImportSpecifier'   :
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
    case 'LabeledStatement'  :
    case 'BreakStatement'    :
    case 'ContinueStatement' : return false;
    case 'MemberExpression'  : return key !== 'property' || parent.computed;
    case 'MethodDefinition'  :
    case 'PropertyDefinition': return key !== 'key' || parent.computed;
    case 'Property'          : return key === 'value' ? true : parent.computed;
    case 'RsNamedArgument'   : return key !== 'name';
    case 'RsProxyMember'     : return key !== 'key' || parent.computed;
  }
  return true;
}

function enterScope (node, scope) {
  switch (node.type) {
    case 'Program': {
      const next = new Scope(scope, true);
      collectHoisted(next, node.body);
      collectStatements(next, node.body);
      return next;
    }
    case 'BlockStatement':
    case 'StaticBlock': {
      const next = new Scope(scope);
      collectStatements(next, node.body);
      return next;
    }
    case 'ArrowFunctionExpression':
    case 'FunctionDeclaration':
    case 'FunctionExpression': {
      const next = new Scope(scope, true);
      if (node.type === 'FunctionExpression' && node.id) next.declare(node.id.name, 'function');
      for (const param of node.params) for (const name of namesOf(param)) next.declare(name, 'param');
      if (node.body.type === 'BlockStatement') collectHoisted(next, node.body.body);
      return next;
    }
    case 'CatchClause': {
      const next = new Scope(scope);
      for (const name of namesOf(node.param)) next.declare(name, 'let');
      return next;
    }
    case 'ClassExpression': {
      const next = new Scope(scope);
      if (node.id) next.declare(node.id.name, 'class');
      return next;
    }
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'ForStatement':
    case 'RsNakedFor': {
      const next = new Scope(scope);
      const head = node.left ?? node.init;
      if (head?.type === 'VariableDeclaration') {
        for (const declarator of head.declarations) for (const name of namesOf(declarator.id)) next.declare(name, head.kind);
      }
      return next;
    }
    case 'SwitchStatement': {
      const next = new Scope(scope);
      for (const switchCase of node.cases) collectStatements(next, switchCase.consequent);
      return next;
    }
  }
  return scope;
}

export function transform (root, visitors, context) {
  const visit = (node, parent, key, scope) => {
    if (!node || typeof node.type !== 'string') return node;

    context.scope = scope;
    visitors[`enter:${node.type}`]?.(node, parent, key, context);

    const inner = enterScope(node, scope);

    for (const field of Object.keys(node)) {
      if (SKIP_KEYS.has(field)) continue;
      const value = node[field];
      if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
          const replaced = visit(value[index], node, field, inner);
          if (replaced !== value[index]) value[index] = replaced;
        }
        // statements may be expanded into several
        if (value.some(item => Array.isArray(item))) node[field] = value.flat();
      } else if (value && typeof value === 'object' && typeof value.type === 'string') {
        node[field] = visit(value, node, field, inner);
      }
    }

    context.scope = scope;
    const exit = visitors[node.type];
    if (!exit) return node;
    const result = exit(node, parent, key, context);
    return result === undefined ? node : result;
  };

  return visit(root, null, null, null);
}

export { isFunctionNode };
