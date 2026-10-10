// @ratscript/compiler/scope.js
// minimal lexical scope tracking: enough for const detection, shadow warnings and free names

const FUNCTION_TYPES = new Set(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression']);

export class Scope {

  constructor (parent = null, isFunction = false) {
    this.bindings   = new Map;
    this.isFunction = isFunction;
    this.parent     = parent;
  }

  declare (name, kind) {
    if (!this.bindings.has(name)) this.bindings.set(name, kind);
  }

  // the nearest function (or program) scope, target of `var`
  get functionScope () {
    let scope = this;
    while (!scope.isFunction && scope.parent) scope = scope.parent;
    return scope;
  }

  lookup (name) {
    for (let scope = this; scope; scope = scope.parent) {
      if (scope.bindings.has(name)) return scope.bindings.get(name);
    }
    return null;
  }
}

// :::::: PATTERN NAMES

export function namesOf (pattern, names = []) {
  if (!pattern) return names;
  switch (pattern.type) {
    case 'ArrayPattern'      : for (const element of pattern.elements) namesOf(element, names); break;
    case 'AssignmentPattern' : namesOf(pattern.left, names); break;
    case 'Identifier'        : names.push(pattern.name); break;
    case 'ObjectPattern'     : for (const prop of pattern.properties) namesOf(prop.type === 'RestElement' ? prop : prop.value, names); break;
    case 'RestElement'       : namesOf(pattern.argument, names); break;
  }
  return names;
}

// :::::: DECLARATION COLLECTING

function declareVariables (scope, declaration) {
  const target = declaration.kind === 'var' ? scope.functionScope : scope;
  for (const declarator of declaration.declarations) {
    for (const name of namesOf(declarator.id)) target.declare(name, declaration.kind);
  }
}

// declarations made directly in a statement list
export function collectStatements (scope, statements) {
  for (let statement of statements) {
    if (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration') {
      statement = statement.declaration;
      if (!statement) continue;
    }
    switch (statement.type) {
      case 'ClassDeclaration'    : if (statement.id) scope.declare(statement.id.name, 'class'); break;
      case 'FunctionDeclaration' : if (statement.id) scope.declare(statement.id.name, 'function'); break;
      case 'ImportDeclaration'   : for (const specifier of statement.specifiers) scope.declare(specifier.local.name, 'import'); break;
      case 'VariableDeclaration' : declareVariables(scope, statement); break;
    }
  }
}

// `var` anywhere inside a function body hoists to the function scope
export function collectHoisted (scope, node) {
  const visit = child => {
    if (!child || typeof child !== 'object') return;
    if (Array.isArray(child)) { for (const item of child) visit(item); return; }
    if (FUNCTION_TYPES.has(child.type)) return;
    if (child.type === 'VariableDeclaration' && child.kind === 'var') declareVariables(scope, child);
    for (const key in child) if (key !== 'loc' && typeof child[key] === 'object') visit(child[key]);
  };
  visit(node);
}

export const isFunctionNode = node => FUNCTION_TYPES.has(node.type);
