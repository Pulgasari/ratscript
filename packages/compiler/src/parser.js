// @ratscript/compiler/parser.js
// acorn plugin: extends the javascript grammar by the ratscript syntax

import { Parser, TokenType, lineBreak, tokTypes as tt } from 'acorn';

// :::::: TOKENS

export const tokens = {
  hash  : new TokenType('#',  { beforeExpr: true, startsExpr: true }),
  pipe  : new TokenType('|>', { beforeExpr: true, binop: 0.5 }),
  proto : new TokenType('::'),
  range : new TokenType('..', { beforeExpr: true, binop: 8.5 }),
};

// precedence of `is`, same level as `instanceof`
const IS_PRECEDENCE = 7;

// acorn internals, see scopeflags in acorn.mjs
const BIND_LEXICAL   = 2;
const SCOPE_FUNCTION = 2;
const SCOPE_SUPER    = 64;

const NUMBER_BEFORE_RANGE = /^\d[\d_]*(?:\.\d[\d_]*)?(?=\.\.(?!\.))/;
const SPACE               = /^[ \t]*/;

// :::::: PLUGIN

export function ratscript (Base) {
  return class RatScriptParser extends Base {

    // :::::: TOKENIZER

    // '#[' '#(' '#{' open list, tuple and record literals, '#name' stays a private name
    readToken_numberSign () {
      const next = this.input.charCodeAt(this.pos + 1);
      if (next === 91 || next === 40 || next === 123) {
        ++this.pos;
        return this.finishToken(tokens.hash, '#');
      }
      return super.readToken_numberSign();
    }

    // '..' is the range operator, '...' stays spread
    readToken_dot () {
      const next  = this.input.charCodeAt(this.pos + 1);
      const next2 = this.input.charCodeAt(this.pos + 2);
      if (next === 46 && next2 !== 46) return this.finishOp(tokens.range, 2);
      return super.readToken_dot();
    }

    // '1..10' must not read '1.' as a decimal number
    readNumber (startsWithDot) {
      if (!startsWithDot) {
        const match = NUMBER_BEFORE_RANGE.exec(this.input.slice(this.pos));
        if (match) {
          this.pos += match[0].length;
          return this.finishToken(tt.num, Number(match[0].replaceAll('_', '')));
        }
      }
      return super.readNumber(startsWithDot);
    }

    // '|>' is the pipe operator
    readToken_pipe_amp (code) {
      if (code === 124 && this.input.charCodeAt(this.pos + 1) === 62) return this.finishOp(tokens.pipe, 2);
      return super.readToken_pipe_amp(code);
    }

    // '::' is the prototype accessor
    getTokenFromCode (code) {
      if (code === 58 && this.input.charCodeAt(this.pos + 1) === 58) return this.finishOp(tokens.proto, 2);
      return super.getTokenFromCode(code);
    }

    // :::::: LOOKAHEAD HELPERS

    // the source right behind the current token
    rsRest () {
      return this.input.slice(this.end);
    }

    // true if the current token is the bare word `word`
    rsIsWord (word) {
      return this.type === tt.name && this.value === word && !this.containsEsc;
    }

    // `fn` as keyword: followed by a name or `*` (statement), or also `(` (expression)
    rsIsFn (allowAnonymous) {
      if (!this.rsIsWord('fn')) return false;
      const rest = this.rsRest().replace(SPACE, '');
      if (/^[A-Za-z_$*]/.test(rest)) return true;
      return allowAnonymous && rest[0] === '(';
    }

    // `async fn ...` on one line
    rsIsAsyncFn (allowAnonymous) {
      if (!this.rsIsWord('async')) return false;
      const rest = this.rsRest();
      const match = /^[ \t]+fn\b[ \t]*(.)/.exec(rest);
      if (!match) return false;
      return /[A-Za-z_$*]/.test(match[1]) || (allowAnonymous && match[1] === '(');
    }

    // :::::: STATEMENTS

    parseStatement (context, topLevel, exports) {
      if (this.rsIsFn(false)) {
        const node = this.startNode();
        return this.rsMarkFn(this.parseFunctionStatement(node, false, !context));
      }
      if (this.rsIsAsyncFn(false)) {
        const node = this.startNode();
        this.next(); // 'async'
        return this.rsMarkFn(this.parseFunctionStatement(node, true, !context));
      }
      if (this.rsIsWord('proxy') && /^\s+[A-Za-z_$][\w$]*\s+for\b/.test(this.rsRest())) {
        return this.rsParseProxy();
      }
      return super.parseStatement(context, topLevel, exports);
    }

    shouldParseExportStatement () {
      if (this.rsIsFn(false) || this.rsIsAsyncFn(false)) return true;
      if (this.rsIsWord('proxy')) return true;
      return super.shouldParseExportStatement();
    }

    // `async fn` is not seen by acorn's own check, which looks for 'function'
    isAsyncFunction () {
      return this.rsIsAsyncFn(false) || super.isAsyncFunction();
    }

    // function Owner::method () {}  ->  Owner.prototype.method = function method () {}
    parseFunctionStatement (node, isAsync, declarationPosition) {
      const rest = this.input.slice(this.end);
      const isProto = /^\s*[A-Za-z_$][\w$]*\s*::/.test(rest);
      if (!isProto) return super.parseFunctionStatement(node, isAsync, declarationPosition);

      this.next(); // 'function' | 'fn'
      const owner = this.parseIdent();
      this.expect(tokens.proto);
      const method = this.parseIdent(true);

      const value = this.startNodeAt(method.start, method.loc && method.loc.start);
      this.parseFunction(value, 0, false, isAsync);
      value.id = method;

      const left = this.rsMember(this.rsMember(owner, this.rsIdent('prototype', owner)), method);
      const assignment = this.startNodeAt(node.start, node.loc && node.loc.start);
      Object.assign(assignment, { left, operator: '=', right: value });
      this.finishNode(assignment, 'AssignmentExpression');

      node.expression = assignment;
      return this.finishNode(node, 'ExpressionStatement');
    }

    // try/catch/finally take a block or a single statement, a lone try fails silently
    parseTryStatement (node) {
      this.next();
      node.block   = this.rsParseClause(true);
      node.handler = null;

      if (this.type === tt._catch) {
        const clause = this.startNode();
        this.next();
        if (this.eat(tt.parenL)) {
          clause.param = this.parseCatchClauseParam();
        } else {
          clause.param = null;
          this.enterScope(0);
        }
        clause.body = this.rsParseClause(false);
        this.exitScope();
        node.handler = this.finishNode(clause, 'CatchClause');
      }

      node.finalizer = this.eat(tt._finally) ? this.rsParseClause(true) : null;
      if (!node.handler && !node.finalizer) node.rsSilent = true;

      return this.finishNode(node, 'TryStatement');
    }

    // a block, or a single statement wrapped into one
    rsParseClause (newScope) {
      if (this.type === tt.braceL) return this.parseBlock(newScope);
      const block = this.startNode();
      const outer = this.rsInClause;
      if (newScope) this.enterScope(0);
      this.rsInClause = true;
      block.body = [this.parseStatement(null)];
      this.rsInClause = outer;
      if (newScope) this.exitScope();
      return this.finishNode(block, 'BlockStatement');
    }

    // a single-statement clause may end right before `catch` / `finally` on the same line
    canInsertSemicolon () {
      if (this.rsInClause && (this.type === tt._catch || this.type === tt._finally)) return true;
      return super.canInsertSemicolon();
    }

    // for (iterable) {}  ->  naked loop, the iterable may be a number
    parseFor (node, init) {
      if (init && this.type === tt.parenR) {
        this.next();
        node.iterable = init;
        node.body     = this.parseStatement('for');
        this.exitScope();
        this.labels.pop();
        return this.finishNode(node, 'RsNakedFor');
      }
      return super.parseFor(node, init);
    }

    // proxy Name for target { get x : value; set y (v) {} fn z () {} }
    rsParseProxy () {
      const declaration = this.startNode();
      this.next(); // 'proxy'

      const id = this.parseIdent();
      this.declareName(id.name, BIND_LEXICAL, id.start);
      this.expect(tt._for);

      const expression = this.startNode();
      expression.target  = this.parseMaybeAssign();
      expression.members = [];

      this.expect(tt.braceL);
      while (!this.eat(tt.braceR)) {
        if (this.eat(tt.semi) || this.eat(tt.comma)) continue;
        expression.members.push(this.rsParseProxyMember());
      }
      this.finishNode(expression, 'RsProxyExpression');

      const declarator = this.startNodeAt(id.start, id.loc && id.loc.start);
      declarator.id   = id;
      declarator.init = expression;
      this.finishNode(declarator, 'VariableDeclarator');

      declaration.kind         = 'const';
      declaration.declarations = [declarator];
      return this.finishNode(declaration, 'VariableDeclaration');
    }

    rsParseProxyMember () {
      const member = this.startNode();

      if (this.rsIsWord('static')) this.raise(this.start, "'static' is not supported in proxy");
      if (!this.rsIsWord('get') && !this.rsIsWord('set') && !this.rsIsWord('fn')) {
        this.raise(this.start, "proxy members start with 'get', 'set' or 'fn'");
      }

      member.kind = this.value;
      this.next();
      this.parsePropertyName(member);

      // get x { ... }  /  get x : { ... }  ->  getter body
      // fn x (...) {}  /  get x () {}  /  set x (v) {}  ->  method
      // fn x : () => {}  ->  the given function
      // get x : value  /  fn x : value  ->  returns the constant
      if (this.type === tt.parenL) {
        member.value = this.parseMethod(false, false);
        member.mode  = 'function';
        return this.finishNode(member, 'RsProxyMember');
      }

      if (this.type !== tt.braceL) this.expect(tt.colon);

      if (this.type === tt.braceL) {
        member.value = this.rsParseBodyFunction();
        member.mode  = 'function';
        return this.finishNode(member, 'RsProxyMember');
      }

      member.value = this.parseMaybeAssign();
      const isFunction = member.value.type === 'ArrowFunctionExpression' || member.value.type === 'FunctionExpression';
      if (member.kind === 'set' && !isFunction) this.raise(member.value.start, 'a proxy setter needs a function');
      member.mode = member.kind !== 'get' && isFunction ? 'function' : 'constant';
      this.semicolon();

      return this.finishNode(member, 'RsProxyMember');
    }

    // a function without parameter list: { ... }
    rsParseBodyFunction () {
      const node = this.startNode();
      const { yieldPos, awaitPos, awaitIdentPos } = this;

      this.initFunction(node);
      node.generator = false;
      node.async     = false;
      this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
      this.enterScope(SCOPE_FUNCTION | SCOPE_SUPER);
      node.params = [];
      this.parseFunctionBody(node, false, true, false);

      Object.assign(this, { yieldPos, awaitPos, awaitIdentPos });
      return this.finishNode(node, 'FunctionExpression');
    }

    // :::::: EXPRESSIONS

    parseExprAtom (refDestructuringErrors, forInit, forNew) {
      // #[...]  #(...)  #{...}
      if (this.type === tokens.hash) {
        const node = this.startNode();
        this.next();
        if (this.type === tt.bracketL) {
          node.elements = super.parseExprAtom(refDestructuringErrors).elements;
          return this.finishNode(node, 'RsListExpression');
        }
        if (this.type === tt.braceL) {
          node.properties = this.parseObj(false, refDestructuringErrors).properties;
          return this.finishNode(node, 'RsRecordExpression');
        }
        this.expect(tt.parenL);
        this.rsNoNamedArguments = true;
        node.elements = this.parseExprList(tt.parenR, true, false, refDestructuringErrors);
        return this.finishNode(node, 'RsTupleExpression');
      }

      // fn (...) {}  /  fn name (...) {}
      if (this.rsIsFn(true)) {
        const node = this.startNode();
        this.next();
        return this.rsMarkFn(this.parseFunction(node, 0, false, false, forInit));
      }

      // async fn (...) {}
      if (this.rsIsAsyncFn(true)) {
        const node = this.startNode();
        this.next(); // 'async'
        this.next(); // 'fn'
        return this.rsMarkFn(this.parseFunction(node, 0, false, true, forInit));
      }

      return super.parseExprAtom(refDestructuringErrors, forInit, forNew);
    }

    // `is` as binary operator, only on the same line as its left side
    parseExprOp (left, leftStartPos, leftStartLoc, minPrec, forInit) {
      if (this.rsIsWord('is') && IS_PRECEDENCE > minPrec && !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) {
        this.next();
        const startPos = this.start, startLoc = this.startLoc;
        const right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, IS_PRECEDENCE, forInit);
        const node  = this.buildBinary(leftStartPos, leftStartLoc, left, right, 'is', false);
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit);
      }
      return super.parseExprOp(left, leftStartPos, leftStartLoc, minPrec, forInit);
    }

    // Owner::member  ->  Owner.prototype.member
    parseSubscript (base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
      if (this.type === tokens.proto) {
        this.next();
        const prototype = this.rsMember(base, this.rsIdent('prototype', base), startPos, startLoc);
        const member    = this.startNodeAt(startPos, startLoc);
        member.object   = prototype;
        member.property = this.parseIdent(true);
        member.computed = false;
        member.optional = false;
        return this.finishNode(member, 'MemberExpression');
      }
      return super.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);
    }

    // new List of String (...)  ->  typed construction
    parseNew () {
      const node = super.parseNew();
      if (node.type !== 'NewExpression' || !this.rsIsWord('of')) return node;
      if (this.input.slice(node.callee.end, node.end).includes('(')) return node;

      this.next(); // 'of'
      const startPos = this.start, startLoc = this.startLoc;
      node.rsType    = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
      node.arguments = this.eat(tt.parenL) ? this.parseExprList(tt.parenR, true, false) : [];
      return this.finishNode(node, 'RsTypedNewExpression');
    }

    // call arguments may be named: f(1, name: 'x')
    parseExprList (close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
      const allowNamed = close === tt.parenR && !this.rsNoNamedArguments;
      this.rsNoNamedArguments = false;
      if (!allowNamed) return super.parseExprList(close, allowTrailingComma, allowEmpty, refDestructuringErrors);

      const elements = [];
      let first = true, named = false;

      while (!this.eat(close)) {
        if (!first) {
          this.expect(tt.comma);
          if (allowTrailingComma && this.afterTrailingComma(close)) break;
        } else first = false;

        if (this.type === tt.name && /^\s*:(?!:)/.test(this.rsRest())) {
          const argument = this.startNode();
          argument.name = this.parseIdent(true);
          this.expect(tt.colon);
          argument.value = this.parseMaybeAssign(false, refDestructuringErrors);
          elements.push(this.finishNode(argument, 'RsNamedArgument'));
          named = true;
          continue;
        }

        if (named) this.raise(this.start, 'positional arguments must come before named ones');
        elements.push(this.type === tt.ellipsis ? this.parseSpread(refDestructuringErrors) : this.parseMaybeAssign(false, refDestructuringErrors));
      }

      return elements;
    }

    // { a as b }, { a as b = 1 } in destructuring
    parsePropertyValue (prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
      const canRename = !prop.computed && prop.key.type === 'Identifier' && !isGenerator && !isAsync;
      if (!canRename || !this.rsIsWord('as')) {
        return super.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
      }

      this.next(); // 'as'
      const alias = this.parseIdent();

      if (isPattern) {
        prop.value = this.parseMaybeDefault(alias.start, alias.loc && alias.loc.start, alias);
      } else if (this.type === tt.eq && refDestructuringErrors) {
        if (refDestructuringErrors.shorthandAssign < 0) refDestructuringErrors.shorthandAssign = this.start;
        prop.value = this.parseMaybeDefault(alias.start, alias.loc && alias.loc.start, alias);
      } else {
        prop.value = alias;
      }

      prop.kind      = 'init';
      prop.shorthand = false;
      prop.rsAs      = true;
    }

    // :::::: NODE HELPERS

    rsMarkFn (node) {
      node.rsFn = true;
      return node;
    }

    rsIdent (name, at) {
      const node = this.startNodeAt(at.start, at.loc && at.loc.start);
      node.name = name;
      return this.finishNodeAt(node, 'Identifier', at.end, at.loc && at.loc.end);
    }

    rsMember (object, property, startPos = object.start, startLoc = object.loc && object.loc.start) {
      const node = this.startNodeAt(startPos, startLoc);
      Object.assign(node, { computed: false, object, optional: false, property });
      return this.finishNodeAt(node, 'MemberExpression', property.end, property.loc && property.loc.end);
    }
  };
}

// :::::: PARSE

const RatScriptParser = Parser.extend(ratscript);

export function parse (source, options = {}) {
  return RatScriptParser.parse(source, {
    allowHashBang : true,
    ecmaVersion   : 'latest',
    locations     : true,
    sourceType    : 'module',
    ...options,
  });
}

export default parse;
