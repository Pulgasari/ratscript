# RatScript – Bestandsaufnahme (Istzustand)

Stand: Repo-Inhalt `main` @ `5d08ec9`. Reine Erfassung, keine Bewertung.
Alle Quellen: 83 Dateien, keine gelöschten Dateien in der Historie.

---

## 0. Übersicht: Feature × Fundort

Legende: `x` vorhanden · `~` teilweise / abweichend · `-` nicht vorhanden

Spalten:
- **Doc** = `README.md` / `spec/readme.md`
- **Notes** = `spec/scratchpad.md`, `spec/reactivity.js`, `spec/notes_on_js.md`, `builtin/README.md`
- **Old** = `packages/compiler-old` (Regex-Compiler)
- **P2** = `packages/compiler/2_parser` + `generator` (Recursive-Descent-Parser)
- **P3** = `packages/compiler/parser` (Cosmonaut-basierter Parser, neuester Stand)
- **RT** = `packages/runtime`

| Feature | Doc | Notes | Old | P2 | P3 | RT |
|---|---|---|---|---|---|---|
| `import from '…' use …` | x | - | x | - | - | - |
| Standard `import` / `export` | - | ~ | - | x | x | - |
| `alias … as …` / `alias x = …` | x | - | x | x | x | - |
| `as` im Destructuring | x | - | x | x | x | - |
| `as`-Binding in `if`/`while` | x | - | x | x | x | - |
| `fn` | x | ~ | x | x | x | `_fn` |
| Named Arguments | x | - | x | x | x | `_fn` |
| Naked Loop `for (1..10)` | x | - | ~ | x | x | `_range` |
| Universelles `+=` | x | - | x | x | x | `_assign` |
| Pipe `\|>` | x | - | x | x | x | - |
| Range `..` | x | - | ~ | x | x | `_range` |
| `is`-Operator | - | - | x | x | x | `_is` |
| `inc`-Operator | - | - | x | x | x | `_inc` |
| `cond` | ~ | - | x | - | - | `cond.js` |
| `match` | x | - | x | x | x | - |
| `switch` (erweitert) | x | - | x | ~ | ~ | - |
| `sift` | - | - | x | x | x | - |
| `mold` | - | - | x | x | x | - |
| Assignment Guards (`or return`, `?? return`, `do`) | x | - | x | - | - | - |
| Line Guards (`return if (…)`) | x | - | x | - | - | - |
| `try`/`catch`/`finally` Kurzformen | x | - | x | x | x | - |
| Multiline Strings ```` ``` ```` | x | - | x | - | - | - |
| JSX → htm | x | - | x | x | x | - |
| JSX Multi-Attribut `[id, name]="…"` | x | - | x | - | - | - |
| Prototype Accessor `::` | x | - | x | - | - | - |
| `proxy` | x | - | - | - | - | ~ |
| `trait` / `use` | x | - | x | x | x | `Trait` |
| List `#[…]` | x | - | x | x | x | `List` u.a. |
| Tuple `#(…)` | - | - | x | x | x | `Tuple` |
| `enum` | ~ | - | - | - | - | `Enum` |
| `struct` / Record | ~ | - | x | - | - | `Struct`, `Record` |
| `union` | ~ | - | x | x | x | `Union` |
| `signal $x` / `effect {}` / `stylesheet` | ~ | - | x | - | - | - |
| `$()` + reaktive Datentypen | - | x | - | - | - | - |
| Typ-Signatur `::` | - | x | - | - | - | - |
| Direktiven `_:"…"` | - | x | - | - | - | - |
| Labels, `break`/`continue` mit Label | - | - | - | x | x | - |
| `async`/`await`/`yield`/Generatoren | - | - | - | x | x | - |

---

## 1. Selbstverständnis (README)

- experimentelles Projekt aus Neugier
- Liebe zu JS als "awkward weirdo"
- Interesse an Programmiersprachen-Design, Verständnis warum Patterns existieren
- **nicht**: JS "fixen" oder ersetzen
- Angebot:
  - verbesserte Syntax ("which i enjoy")
  - verbesserter Control Flow
  - Builtins
  - Pattern Matching
  - JSX-Support
- Index im README listet: Aliasing, Import, Functions (Named Args), Loops, Operators (Assignment, Pipe, Range), Control Flow (cond, match, switch), Guards, Types (Enum, List, Record, Struct, Trait, Tuple, Union), JSX
- Abschnitte im README, die nicht im Index stehen: `try`/`catch`, `proxy`, Prototype Accessor, Multiline Strings
- leere Abschnitte: `cond`, Enum, Record, Struct, Tuple, Union
- `README.md` (Root) = gekürzte Kopie von `spec/readme.md` (nur About)

---

## 2. Syntax-Features im Detail

### 2.1 Module

**`import from … use …`** (Doc, Old, Example, Zed-Highlights)
```js
import from 'domina'          use * as dom;
import from 'preact'          use { render };
import from 'importeur'       use importeur;
```
- Old: Regex → `import <target> from '<path>';`
- P2/P3: nicht unterstützt, nur Standard-JS-Imports

**Standard Import/Export** (P2, P3)
- `import 'mod'`, `import A`, `import * as ns`, `import { a, b as c }`, Kombinationen `A, { … }` / `A, * as ns`
- `export <decl>`, `export { a, b as c } [from '…']`, `export * [as ns] from '…'`, `export default fn|class|expr`
- Generator: `export default fn` → erst `const name = _fn(…)`, dann `export default name;`

**notes_on_js.md – "what i don't like about js"**
- Import-Syntax (Beispiele mit `@aufbau/api`, `@bunker/db`, `@aufbau/signals`)
- Export-Syntax: `export const sth = …` geht, `export default const sth = …` nicht

### 2.2 Aliasing

- `alias source as name;`
  - `source` ist Member-Chain → Auto-Binding: `const name = a.b.c.bind(a.b);`
  - sonst `const name = source;`
- `alias name = expr;` → `const name = expr;` (nie Auto-Binding, "volle Kontrolle")
  - P2/P3: links von `=` nur einfacher Identifier erlaubt
- `as` im Destructuring: `const { something as sth } = ns;` → `{ something: sth }`
- `as` als Conditional Binding:
  - `if (expr as name) …`, `else if (… as …)`, `while (… as …)`
  - Old: global gehoistetes `let __as_tmp;`
  - P2: eigener Block-Scope pro Binding (`{ let __as_tmp = …; if (__as_tmp) { let name = __as_tmp; … } }`)
  - P2: nur als Test von `if`/`while` gültig (`AsBindingExpression`)

### 2.3 Funktionen

- `fn name (params) { … }`
  - Old/P2: → `const name = _fn(function (params) { … }, ['p1', 'p2']);`
  - P2: `async fn`, `fn*` (Generator)
  - P2: Params nur einfache Identifier (keine Defaults/Rest/Destructuring); Old schneidet Defaults für Namensliste ab
  - P3: `function`-Keyword als TODO notiert
- `fn … use Trait1, Trait2 { … }` → nach Deklaration `Trait.apply(name)`
- Scratchpad: Arrow-Zuweisungsform + Typ-Signatur
  ```js
  :: person = String Number
  fn person = (name, age) => console.log(`${name} is ${age} years old.`);
  ```
- **Named Arguments**
  - `person('Max', 18)` positional, `person(age: 60, name: 'Udo')` named
  - Compile: `person({ __isNamed: true, age: 60, name: 'Udo' })`
  - Runtime `_fn`: erkennt `__isNamed`-Objekt, mappt auf Param-Reihenfolge; hängt `$params` an Funktion
  - P2/P3: Mischen von named + positional verboten (SyntaxError)
  - Old: Erkennung per Regex `ident:` am Anfang der Argumentliste

### 2.4 Schleifen

- Naked Loop: `for (1..10) { … }` → `for (const __for_it of _range(1, 10))`
- `for (let x of 1..10) { … }`
- P2/P3 `for`: nur `for (kind id of iterable)` und naked; `of` kontextuell
- Old: `index.js` importiert `syntax/for.js` (Datei existiert nicht)
- `while (…)` inkl. `as`-Binding

### 2.5 Operatoren

**Universelles `+=`** → `left = _assign(left, right)`
- nullish links → `right`
- number/string → `left + right`
- Array → `push`
- Set → `add`
- Map → `set` aus `[k, v]` oder aus Objekt-Entries
- Object → `Object.assign`
- Fallback → `left + right`
- Runtime-Version 1 via `@pulgasari/shift` (nur nullish/number/string/array/set), danach alter Code
- übrige Compound-Operatoren (`-=`, `*=` …) → 1:1 JS

**Pipe `|>`**
- `x |> f` → `f(x)` (implizit)
- `x |> f()` → `f(x)`
- `x |> f(a)` (ohne Platzhalter) → `f(x, a)` (vorne einfügen)
- Platzhalter:
  - Doc / Old / Zed: `#` → `x |> f(#)`
  - P2/P3: `_` → `x |> f(1, _)`
- P2: Named Args im Pipe-Schritt nur mit `_`: `x |> f(key: _)`
- Pipe-Ziel muss Identifier oder Call sein
- Beispiele: `|> String`, `|> Number`, `|> Boolean`, `|> Math.round`, `|> console.log` (Debugging am Kettenende)
- Präzedenz 2, linksassoziativ

**Range `..`**
- `1..100`, `'A'..'Z'`, `'a'..'z'`, rückwärts `100..1`, `'Z'..'A'`
- erzeugt Iterator (Generator)
- Runtime `_range(from, to, step = null)`:
  - inklusiv
  - Char-Ranges via `charCodeAt`
  - Richtung automatisch
  - `step` optional (keine Syntax dafür), Fehler bei 0 / falscher Richtung
- `runtime/range.js`: Sammlung von Entwürfen (exklusiv, mit Mapper `range(64, 75, String.fromCharCode)`, Flip, `arrayRange(start, stop, step)`)
- P2: `from`/`to` nur Primaries

**`is`**
- `value is Pattern` → `_is(value, pattern)`
- Semantik `_is`:
  - List vs List → `equals`
  - Record vs Struct → `record.struct === struct`
  - Tuple vs Tuple → `equals`
  - Union-Value vs Variant/Union → `$union` + `$variant`
  - Identität `===`
  - Pattern = Funktion:
    - `Array`, `Boolean`, `Number`, `Object`, `RegExp`, `String` → typeof-Checks
    - `List`, `Record`, `Tuple` → isX
    - Klasse → `instanceof`
    - sonst Prädikat / `cond` → `!!pattern(value)`
  - Pattern = Objekt → rekursives Deep-Shape-Matching
  - Trait-Check auskommentiert
- zweite Variante: delegiert Funktions-Patterns an `Type.isType`
- Old `cond.js` zusätzlich: `x is condName` → `condName(x)`
- Präzedenz 7

**`inc`** (Enthaltensein)
- `needle inc haystack` → `_inc(needle, haystack)`
- Array/String → `includes`, Set/Map → `has`, Object → `in`
- `nodes.js`: "TODO: rename to 'in'?"
- Präzedenz: Old-meta 15 rechts, neue meta 8 links

**`or`** – Alias für `||` (in Guards; Zed-Keyword)

**Operatortabelle** (Old `meta.js`): `=`, `+=`, `|>`, `||`, `&&`, `is`, `===`, `<`, `+`, `-`, `*`, `/`, `inc` mit Präzedenz/Assoziativität

### 2.6 Control Flow

**`cond`**
- `cond name = expr;` → `const name = createCond('name', () => expr);` (lazy)
- ist `expr` bereits Funktion (`=>`/`function`) → unverändert übernommen
  - Doc: `cond isArray = v => Array.isArray(v);`
  - Doc: `cond isAdmin = $userRole === 'admin';`
- Runtime `cond.js`: globale `condMap` (Registry, "für DevTools"), setzt `fn.name`, `fn.isRatCondition = true`
- Old: verwendete Cond-Namen ohne `()` werden überall zu `name()`
- nicht in P2/P3 (nicht in neuer Keyword-Liste)

**`match`** (Expression, "inspiriert von PHP")
- `match (x) { 'cat': 'meow', 'dog': 'woof', default: 'silent' }`
- Werte können Funktionen sein → Ergebnis aufrufbar (`makeNoise()`)
- `await` in Cases → async IIFE + `await`
- Naked Match `match { isBanned: …, isAdmin: … }` → matcht gegen `true`; Keys = Bool-Ausdruck oder Nullary-Funktion/cond (wird aufgerufen)
- Tuple Match `match (a, b) { (true, 'admin'): …, default: … }`
- P2: mehrere Keys pro Case `a, b: …`
- Old: Default-Wert lazy (Funktion wird aufgerufen); P2: nicht
- Doc-Beispiel: Prädikat-conds als Keys mit Subject (`match (options) { isArray: …, isRecord: …, isString: … }`)
- Kompilat: IIFE mit `switch (true)` / `switch (x)` + `return`

**`switch`** (erweitert)
- `'cat': meow();` – ohne `case`/`break`
- Multi-Case `'dog', 'wolf': bark();`
- Tuple Switch `switch (isBig, myAnimal) { (true, 'dog'): …; }`
- Naked Switch `switch { $score >= 90: grade = 'A'; … }` – Doc + Old; P2/P3 bewusst ohne ("deckt `sift` ab")
- P2: Block-Bodies `{ … }` erlaubt

**`sift`** (nur Code, nicht dokumentiert)
```js
sift {
  init: …,
  condA: action,
  condB: { … },
  catch(e): …,
  finally: …
}
```
- alle Bedingungen sequentiell als `if` (nicht exklusiv), innerhalb `try`
- IIFE, ohne Rückgabewert
- P2: Case-Keys nur einzelne Identifier

**`mold`** (nur Code, nicht dokumentiert)
```js
mold (initialValue) { init: …, cond: action, catch(e): …, finally: … }
```
- wie `sift`, aber `let self = initialValue;` und `return self;`
- P2: als Statement geparst, generiert IIFE-Expression

**Guards**
- Assignment Guards:
  - `let user = fetchUser() or return;` → `!user`-Check
  - `let user = fetchUser() || return;` → wie `or`
  - `let user = fetchUser() ?? return;` → nullish-Check
  - `… or return 'default_v' do logWarning();`
  - `… or do { logWarning(); return 'default_v'; };`
  - `… or do bye();` → Side-Effect ohne Abbruch
- Line Guards:
  - `return if (isBanned);`
  - `return if (hasError) do { cleanup(); … };`
- Keyword `guard` in Old-Keyword-Liste, keine Syntax definiert
- nicht in P2/P3

**`try` / `catch` / `finally`**
- Einzeiler ohne Block: `try doSomething();`, `catch (e) logError(e);`, `finally cleanUp();`
- `catch` ohne Variable
- Standalone `try` → Silent Fail (`catch {}`)
- `try` + `finally` ohne `catch`
- beliebige Mischung Einzeiler/Block

### 2.7 Strings

- Multiline Strings mit drei Backticks
  - optionaler Language-Tag (```` ```html ````) wird entfernt
  - Dedent anhand Einrückung der schließenden Backticks, sonst minimale Einrückung
  - Ergebnis: normaler Template-String
  - nur Old
- Template-Strings mit verschachtelten `${…}` (P2-Lexer: rekursives Lexing)

### 2.8 JSX

- JSX → htm Tagged Template: `html\`…\`` (Import aus `htm/preact`)
  - Komponenten `<Comp>` → `<${Comp}>`, `{expr}` → `${expr}`
- Multi-Attribut-Sugar (nur Old):
  - `[id, name]="test"` → `id="test" name="test"`
  - `[id, name]={$test}` → `id={$test} name={$test}`
- P2-Lexer: eigener JSX-Scanner → Token `JSX_TEMPLATE` (Segmente string/expr)
  - Heuristik: `<` + Buchstabe/`_`/`$`/`/`/`>`
  - dokumentierte Einschränkung: `a<b` wird als JSX erkannt, bewusst nicht gelöst

### 2.9 Prototype Accessor `::` (Doc, Old)

- `function String::shout() { … }` → `String.prototype.shout = function() { … }`
- `String::replaceAll = function (a, b) { … };`
- `Array::first = () => this[0];`
- `Array::forEach.call([1, 2, 3], …)` → `Array.prototype.forEach.call(…)`

### 2.10 `proxy` (nur Doc)

```js
proxy ThingProxy for/of RealThing {
  get password : { return "********"; }
  get password : "********";
  fn doSth () {…}
  fn doSth : () => {…}
  fn doSth : 'function returnt eh nur nen string';
  static get version : …;
  static fn doSth …;
}
```
- `for` oder `of` offen
- Kurzform `member : value` (Wert statt Funktionskörper)
- `_proxy` als Runtime-Helper registriert, keine Implementierung

### 2.11 Traits

- `trait Name { props, methods }` → `new Trait('Name', () => ({ … }))` (Factory, frische Kopie pro Anwendung)
- Anwendung:
  - Klasse: `class User use Serializable { … }` → Prototype erweitert
  - Funktion: `fn sendReport (data) use Trackable { … }` → Props direkt auf Funktionsobjekt (`sendReport.callCount`)
  - Objekt-Literal: `{ … } use Observable`
  - Variable: `session use Identifiable`
  - mehrere: `use A, B` (P2) → `B.apply(A.apply(x))`
- Runtime:
  - Klassenerkennung via `toString()`-Regex `^class`
  - Registry `__traits` (Set) auf Ziel/Prototype
  - `Trait.has(target, trait)`, `Trait.isTrait`
- Doc-Beispiele: Serializable (`toJson`), Trackable (`callCount`, `resetCounter`), Observable (`listeners`, `on`, `emit`)

---

## 3. Typen / Builtins (Runtime)

### 3.1 List-Familie

- Syntax `#[1, 2, 3]` → `new List(1, 2, 3)`
- Doc: "improved and type-checked arrays for values of the same type"
- Typ = `typeof` des ersten Elements, weitere Elemente müssen passen
- zwei Implementierungen:
  - `List.js`: Wrapper um `_values`
  - `List2.js`: `extends Array`
- API `List.js`:
  - Properties: `length`, `type`
  - Index: `indexOf`, `lastIndexOf`, `indexOfLast`
  - Suche: `find`, `findIndex`, `findLast`, `findLastIndex`
  - Zugriff: `at`, `getFirstItem`, `getLastItem`, `with`
  - mutierend (geben `this` zurück): `clear`, `copyWithin`, `push`, `remove(...values)`, `removeByIndex`, `reverse`, `set`, `shuffle`, `sort`, `unshift`, `splice`
  - mutierend + Rückgabe: `pop`, `shift`
  - funktional: `filter`, `map`, `reduce`, `forEach`
  - strukturell: `slice`, `unique`, `zip` (→ Paare), `concat`, `merge` (gleicher Typ), `flatMap` (Callback muss List liefern), `groupBy` (→ Objekt von Lists)
  - nicht-mutierende Klone (Namensschema `toX`): `toMerged`, `toRemoved`, `toRemovedByIndex`, `toReversed`, `toShifted`, `toSliced`, `toSpliced`, `toShuffled`, `toSorted`, `toUnshifted`
  - Checks: `includes`, `every`, `some`, `equals`
  - Konvertierung: `toArray`, `clone` (Methode + Getter), `join`, `toString`
  - statisch: `List.from`, `List.isList`
  - Aliase: `any`, `contains`, `has`, `get`
  - Iterator (drei Varianten skizziert: Funktion, Klasse, Prototype)
- `NumberList`:
  - mutierend: `increment`, `decrement`, `scale`, `clamp`, `round`, `floor`, `ceil`, `abs`, `sqrt`, `log`
  - Klone: `toIncremented`, `toDecremented`, `toScaled`, `toClamped`, `toCeiled`, `toFloored`, `toRounded`
- `StringList`:
  - mutierend: `toLowerCase`, `toUpperCase`, `trim`, `replaceAll`, `padStart`, `padEnd`
  - Klone: `toLowerCased`, `toUpperCased`, `toTrimmed`, `toReplacedAll` ("naming ?")
  - auskommentiert: `substring`, `toSubstringed`, `split` (→ List von StringLists)
- `ObjectList` (zwei Fassungen in einer Datei):
  - nur plain objects
  - `remove(criteria)` per Shape, `mapKeys`, `mapValues`
  - Klone: `toPushed`, `toUnshifted`, `toSet`, `toRemoved`, `toRemovedByIndex`, `toMappedKeys`, `toMappedValues`, `toFiltered`, `toSortedBy`, `toUniqueBy`
  - Query: `pluck`, `findBy`, `countBy`, `groupBy`, `indexBy`, `entries`
- `RecordList`: ObjectList, nur Records eines bestimmten Structs
- `List2.js` Ideen (Pseudo-Code):
  - Validierung als Kombinator: `validateOrError(errorcode)`, `checkCondition(cond)`
  - `equals` via `match(typeOf(this), lengthOf(this))`
  - `return switch (other) ([ not(matchTypeOf(this)) : false, … ])`
  - `static isList = isInstanceOf(List)`
- Example: `new StringList(['dark', 'light', 'oled'])` und `#['dark', 'light', 'oled']` nebeneinander

### 3.2 Tuple

- Syntax `#(1, 'cat', true)` → `new Tuple(…)`
- immutable (frozen), Index-Zugriff `t[0]`
- `get`, `values`, `toArray`, `with(index, value)` → neues Tuple, `map` → Tuple, `equals`, `length`, Iterator, `toString` → `Tuple(…)`

### 3.3 Enum

- Keyword `enum` in beiden Keyword-Listen, keine Syntax definiert
- Runtime: `new Enum('A', 'B', …)`
  - `EnumValue` (frozen, `enum`, `name`, `toString`)
  - Zugriff `MyEnum.A`
  - `parse(name)` (wirft), `tryParse(name)` (→ null)
  - `names`, `values` (Methode und Getter), `has`, `isEnumValue`, Iterator
  - `Enum.isEnum(value)`

### 3.4 Struct / Record

- Syntax `struct Name { schema }` → `const Name = new Struct({ … });` (Old)
- Schema-Feld:
  - `'string'` / `'number'` … (typeof-Name)
  - Enum
  - Struct (verschachtelt, Wert muss Record dieses Structs sein)
  - `{ type, default, optional }`
- `Struct`: `keys`, `defaults`, `validate`, `create(values)` → Record, `Struct.isStruct`
- `Record`: immutable Instanz eines Structs
  - Felder als Properties
  - `with(key, value)`, `merge`/`toMerged`, `get`, `keys`, `entries`, `has`, `toObject`, `equals`, `toString`, Iterator über Werte
  - `Record.isRecord`

### 3.5 Union (drei Konzepte)

1. **Mitglieds-Union** (P2/P3, Runtime `Union` neu)
   - `union Name = a | b | c;` → `new Union('Name', [a, b, c])`
   - Members: Konstruktoren (`String`, `Number`, `Boolean`, Klassen) oder Literalwerte
   - `check(value)`, `assert(value)`, `members`, `name`
2. **Tagged Union** (Old, Runtime `Union` alt)
   - `union Response { Loading, Success(payload) }` → `new Union('Response', { Loading: [], Success: ['payload'] })`
   - Varianten ohne Payload = Wert, mit Payload = Factory
   - `UnionValue` mit `$union`, `$variant`, Payload-Feldern
   - `Variant.is(val)`, `variants`, `has`
3. `_is` unterstützt Varianten-Matching

### 3.6 Type

- `Type.of(value)` → normalisierte Namen: `'null'`, `'undefined'`, `'array'`, `'nan'`, sonst `typeof`
- `Type.isNullish`, `Type.isType(value, pattern)`, `Type.isTypeOf(value, name)`
- Zweck laut Kommentar: JS-Typ-Eigenheiten an einer Stelle zentralisieren

### 3.7 Point

- `class Point { x, y }`, `static distance(a, b)` (via `Math.hypot`)

### 3.8 Builtin-Checkliste (`builtin/README.md`)

- Data-Types jeweils normal + reaktiv: `Array`/`$Array`, `Enum`/`$Enum`, `List`/`$List`, `Map`/`$Map`, `Record`/`$Record`, `Point`/`$Point`, `Tuple`/`$Tuple`
- `Type`, `Union`
- `$`

---

## 4. Reaktivität

### 4.1 Compiler-Sugar (Old `signals.js`)

- `signal $name = value;` → `const __name = new Signal(value);`
- `signal $flag: bool = true;` → `new SignalBool(…)`
- jede Referenz `$name` → `__name.value`
- `effect { … };` → `new Effect(() => { … });`
- `stylesheet 'path';` → `linkStylesheet('path');`
- Old-Kompilat importiert `Signal`, `SignalBool`, `Effect` aus `./reactivity.js` (Datei leer)
- Doc-Beispiele nutzen `$theme`, `$userId`, `$userRole`, `$userStatus`, `$score`
- Zed: `$`-Variablen speziell hervorgehoben, Keywords `signal`, `effect`

### 4.2 Konzept (`spec/reactivity.js`, eigentlich Markdown)

- Kombination aus:
  - "kinda typed variant" von `@preact/signals`
  - erweiterte reaktive Varianten nativer Datentypen
  - spezielle `$`-Methode
  - etwas Compiler-/Preprocessor-Arbeit
- Datentypen: `$Date`, `$Map`, `$Number`, `$Point`, `$Set`, `$String`, `$Time`
- Skizzen:
  - `$Map extends Map` mit internem Versions-Signal (`get` liest, `set` inkrementiert)
  - `$object(data)` → Proxy mit Versions-Signal
  - `$Date extends Date` (Getter registrieren, Setter triggern)
  - `$localStorage`: reaktiver Storage-Proxy, ein Signal pro Key, Sync über `storage`-Event (andere Tabs)
  - `$(value)`: universelle Factory, mit/ohne `new`
    - Primitive → `signal`
    - Map → `$Map`
    - Date → `$Date`
    - Object/Array → reaktiver Proxy
- Compiler-Idee (Input als ".htx"):
  - `let name = new $('Udo'); name = 'Peter';` → `const name = signal('Udo'); name.value = 'Peter';` (automatisches `.value`)
  - `new $({ … })` / `new $(new Map())` → Proxy / `$Map`, kein `.value` nötig
- Notizen "primitive problems" (`new String` vs Primitive):
  - `typeof` → `'object'` vs `'string'`
  - `===` vergleicht Referenz
  - leeres String-Objekt ist truthy
  - Objekt kann Custom-Properties halten

### 4.3 Example

- `examples/pwa-preact/app.rat` nutzt `@preact/signals` direkt (`signal`, `effect`, `.value`) + `aufbau` (`define`, `update`)

---

## 5. Lose Notizen / Ideen (Scratchpad)

- Typ-Signatur-Zeile: `:: person = String Number`
- Direktiven über Label-Syntax (gültiges JS):
  - `_:"client";` – Client-only-Marker, Preprocessor verschiebt in Client-Bundle
  - `_:"css: .card { color: red; }";` – Scoped CSS / Injection
  - `_:"signal"; let count = 0;` – reaktiver State
- `static {}`-Blöcke in Klassen (Notizen):
  - Custom Element automatisch registrieren
  - Constructable Stylesheet einmalig injizieren
  - geteilten Signal-State initialisieren
  - Zugriff auf private Felder nach außen freigeben
- Reaktive Varianten und `$()` (doppelt zu `spec/reactivity.js`)

---

## 6. Compiler-Architektur

### 6.1 compiler-old (Regex)

- Pipeline aus String-Transformationen, feste Reihenfolge:
  `import_statement → fn → range → for → control_flow (mold, sift) → try_catch → multiline_strings → jsx → alias → prototype_accessor → pipe_operator → is → cond → types (list, struct, trait, tuple, union) → switch → match → guard → inc → assignment_sugar → signals`
- Teilweise Klammer-Balancing per Hand (fn, try, trait, jsx, is)
- Output-Präambel:
  ```js
  import { Signal, SignalBool, Effect } from './reactivity.js';
  import { createCond, condMap } from './cond.js';
  import * from 'ratscript';
  ```
- `meta.js`: Builtins (JS + RatScript), Globals, Keywords, Literals, Operatortabelle, `runtimeHelpers` (`_assign`, `_fn`, `_inc`, `_is`, `_proxy` aus `./../runtime/index.js`)
- Keyword-Liste Old (inkl. Eigenes): `alias`, `as`, `cond`, `do`, `enum`, `fn`, `guard`, `inc`, `is`, `match`, `mold`, `proxy`, `sift`, `struct`, `union`, `use`

### 6.2 compiler (P2: Lexer → Parser → Generator)

- `index.js`: `Lexer(code).tokenize()` → `Parser(tokens).parse()` → `Generator(ast).generate()`
- `readme.md` plant: `1_lexer.js`, `2_parser.js`, `3_transformer.js` (AST modifizieren), `4_generator.js`, `meta.js`, `mod.js`, `nodes.js`, `utils.js`, `jsr.json`/`package.json`
- Ordner real: `1_lexer/`, `2_parser/`, `parser/`, `generator/`, `test/`, `4_generator.js` (Re-Export)

**Lexer (`1_lexer/index.js`)**
- Closure `Lexer(source)` → `{ tokenize, line, column, cursor }`
- Sticky-Regex-Regeln: Operatoren, Puncts, Strings `'…'`/`"…"`, Numbers, Identifier (→ Keyword falls in Liste)
- Number-Regex: Hex/Bin/Oct, Separatoren `_`, Exponent, Schutz für `1..10`
- Kommentare: nur `//`
- Scanner: Template-Strings (rekursives Lexing in `${}`), JSX
- Token-Typen: `EOF`, `IDENTIFIER`, `KEYWORD`, `NUMBER`, `OPERATOR`, `PUNCT`, `STRING`, `TEMPLATE_STRING`, `JSX_TEMPLATE`
- Fehlermeldungen deutsch

**Lexer neu (`1_lexer/index_new.js`)**
- auf Basis `@cosmonaut/lexer` + `@cosmonaut/presets` (`javascript`, `doubleQuotesString`, `singleQuotesString`)
- Config: `comments`, `keywords`, `rules` (`makeRulesFromOperators`, `makeRulesFromPuncts`), `scanners` (Template, JSX), `skipComments`, `skipWhitespaces`

**meta.js (neu)**
- basiert auf `@cosmonaut/presets` `javascript` (globals, literals, puncts, builtins, keywords, operators)
- Builtins + `Enum`, `List`, `Record`, `Struct`, `Trait`, `Tuple`, `Type`, `Union`
- Keywords + `alias`, `enum`, `fn`, `inc`, `is`, `match`, `mold`, `proxy`, `sift`, `struct`, `union`, `use`
- Puncts `()[]{}.:,;?#|`, `wrappers` (braces/brackets/parens)
- Operatoren + `|>` (2), `..` (7), `is` (7), `inc` (8), `unary+`/`unary-` (15)
- `runtimeImports`: Builtins (`builtin/*.js`), Helper (`index.js`), Vendor `html` aus `htm/preact`

**Parser P2 (`2_parser/`)**
- Recursive Descent, modulglobaler State (`init`, `pushState`/`popState` für Template-Segmente)
- Navigation: `advance`, `peek`, `peekNext`, `previous`, `isEOF`, `isToken`, `matchToken`, `consumeToken`
- `TOKEN_MAP`: Token per Wert abfragbar (`isToken('{')`)
- `createEvilFactory({ prefix: 'parse', source })` → `parsed.X`; Funktionen ohne Argumente werden Getter (`parsed.Expression`)
- `ASTNode`-Proxy-Factory über Node-Definitionen (required/default)
- Ausdrucks-Hierarchie:
  `Assignment → Pipe → TraitUse → Binary (Precedence Climbing aus Operatortabelle, inkl. is/inc) → Unary (await, yield, + - ! ~ typeof void delete) → Range → Primary → Postfix (.prop, call)`
- Primary: Number, String, Template, JSX (→ `html`-Tagged-Template), `(…)`, `#(…)`, `#[…]`, `[…]`, `{…}`, `match`, `new`, `_` (Pipe-Platzhalter), Identifier
- Statements: Labeled, `alias`, `async`/`fn`, `break`, `class`, `const`/`let`/`var`, `continue`, `export`, `for`, `if`, `import`, `mold`, `return`, `sift`, `switch`, `trait`, `try`, `union`, `while`, Expression
- Class: nur Methoden, `use`-Traits
- Objekt-Literal: `key: value`, Shorthand `{ x }`, Methoden-Shorthand
- gemeinsames Case-Parsing für `match`/`switch` (`parseMatchCases(isTupleMode, allowBlockValue)`)
- nicht abgedeckt: Arrow Functions, `function`, Ternary, `[]`-Member-Zugriff, Optional Chaining, Spread/Rest, klassisches `for(;;)`, `for…in`, `do…while`, `throw`, Klassenfelder, `extends`, Block-Kommentare

**Parser P3 (`parser/`, neuester Stand, Juli 2026)**
- basiert auf `@cosmonaut/parser`, Optionen: `grammar`, `keywords`, `methods`, `nodeFactory`, `puncts`, `operators`, `tokenTypes`, `wrappers`
- Regeln als `parseX(p)` mit Kontext-API:
  - `p.parse('Rule', ...args)`
  - `p.match`, `p.check`, `p.checkAny`, `p.checkSequence`, `p.consume`, `p.consume(['IDENTIFIER', 'from'])`
  - `p.is('const let var')` (Leerzeichen-getrennte Alternativen)
  - `p.dispatch({ 'const let var': 'VariableDeclaration', … }).or('ExprStatement')`
  - `p.parse('Wrapped', '()', 'ConditionTest')`
  - `p.parseList(fn, { wrapper: '{}' })`
  - `p.pushState` / `p.popState`
- Node-Namen verkürzt: `*Expression` → `*Expr` (Umbenennung angefangen)
- `parseMatchCasesExpr`: alternative Case-Struktur `{ conditions, value }`

**Parser-Ideen (`parser/_test.js`, `2_parser/test.js`)**
- `parseSequence(element, separator)` → `p.parseSequence('Primary', '|')`
- jQuery-artige kurze Ketten: `p.$sequence('Primary', '|').$match(';')`, `p.$.sequence(…)`, `$(p).sequence(…).match(';')`
- `p.switchParse({ … }).or('Expr')` / `.or(() => …)`
- `parseList(cb, { wrapper, trailing, closeToken, separatorToken })`, Wrapper als `'braces'|'brackets'|'parens'|'()'|[open, close]`
- String-Mini-DSL für Listen: `'( IDENTIFIER , )'`, `'(,) IDENTIFIER'`, `'(,)', 'IDENTIFIER'`, `{ open: '(', do: 'IDENTIFIER', while: ',', close: ')' }`
- Grammatik-Notiz (BNF): `expr ::= term + expr | term` …

**Node-Definitionen (`parser/nodes.js`)**
- Formate parallel:
  - Array der Arg-Namen: `['autoBind', 'name', 'source']`
  - Objekt: `{ name: { required: true }, autoBind: { default: false } }`
  - Kurzform mit Markern: `'!x'` required, `'?x'` default null, kombinierbar `'?!'`, Position Prefix/Suffix egal (?)
  - Default per Objekt: `{ '!autoBind': false }`
  - **Cosmonaut Grammar Notation Syntax (CGNS)**: `NODE AliasDeclaration = !autoBind ?name !source`
- Nodes: PipePlaceholder (transient), Declarations (Alias, Class, ExportAll, ExportDefault, ExportNamed, Function, Import, Trait, Union, Variable), Expressions (Array, AsBinding, Assignment, Await, Binary, Call, CompoundAssignment, Inc, Is, List, Match, Member, New, Object, Range, TaggedTemplate, TraitUse, Tuple, Unary, Yield), Statements (Block, Break, Continue, Expression, For, If, Labeled, Mold, Return, Sift, Switch, Try, While), Identifier, Literal, TemplateLiteral, Program, ObjectPattern

**Dialekt-Erkennung (`test/detect.js`)**
- Regeln als Token-Muster: `{ node: 'ImportStatement', pattern: ['import', 'from', 'string', 'use'], end: ';', priority }`
- Wildcards `'...'`, Typ-Platzhalter `'string'`, `'identifier'`
- liefert Fundstellen mit Token-Index und Offsets (RatScript-Konstrukte im Token-Strom finden)

**Generator (`generator/`)**
- `generateX(node)` per `createEvilFactory({ prefix: 'generate' })`, Dispatch über `node.type`
- Helper-Tracking: `useHelper(name)` → `generateProgram` stellt gruppierte Imports voran
- `indent`, `iife`
- angefangene Kurzform: `BlockStatement = ({ body }) => …`
- Kompilate:
  - `fn` → `_fn`-Wrapper
  - `match` → (async) IIFE mit `switch`
  - Tuple-`switch` → Temp-Variablen `__sw_tmp0…` + `switch (true)`
  - `sift`/`mold` → IIFE mit `try`
  - `as`-Binding → Block-Scope mit `__as_tmp`
  - Trait-Use → verschachtelte `.apply`
  - naked `for` → `__for_it`

---

## 7. Tooling (nur Ordnerstruktur skizziert)

- `@ratscript/cli` (Deno-Binary)
  - `commands/compile.js` – Datei lesen → kompilieren → `.js` schreiben
  - `commands/run.js` – im RAM kompilieren und ausführen
  - `commands/init.js` – RatScript-Projekt anlegen
  - `utils/file.js` – `Deno.readTextFile`/`writeTextFile`
  - `main.js`, `mod.js`, `jsr.json`
- `@ratscript/language-server`
  - `capabilities/completion.js` (Enums, Traits …), `diagnostics.js`, `hover.js`
  - `server.js`, `main.js`
- `@ratscript/runtime` (readme): `builtins/Enum.js`, `builtins/Trait.js`, `utils/`, `mod.js`
- Zed-Extension `packages/zed/languages/rat/highlights.scm`
  - basiert auf JS-Tree-sitter-Knoten
  - Custom-Keywords: `cond`, `effect`, `from`, `signal`, `match`, `do`, `is`, `or`, `use`
  - `$`-Variablen, `|>`, `#`
- Dateiendung: `.rat`
- Paketnamen: `@ratscript/compiler`, `@ratscript/runtime`, `@ratscript/cli`, `@ratscript/language-server`; Distribution via JSR / npm

---

## 8. Externe Abhängigkeiten / Bezüge

- `@pulgasari/shift` (in `_assign`)
- `@cosmonaut/lexer`, `@cosmonaut/parser`, `@cosmonaut/parser/utils`, `@cosmonaut/presets`
- `@preact/signals`, `preact`, `htm/preact`
- Deno
- eigene Projekte in Beispielen/Notizen: `aufbau`, `domina`, `importeur`, `bunker` (`@bunker/db`), `htx` (`.htx`-Input)

---

## 9. Code-Zustand (nur Fakten)

Parallel existierende Generationen:
- Regex-Compiler (`compiler-old`)
- P2 (`2_parser` + `generator` + `1_lexer/index.js`)
- P3 (`parser/` + `1_lexer/index_new.js`, Cosmonaut)

Nicht lauffähig / Syntaxfehler:
- `compiler/index.js` importiert `./lexer`, `./parser`, `./generator` als Klassen; Ordner heißen `1_lexer`, `2_parser`; Exporte sind Funktionen
- `compiler/meta.js`: `puncts` doppelt deklariert, `JavaScript` statt `javascript`, `buildTokenTypes` ungenutzt
- `1_lexer/index.js`: `type` (const) wird neu zugewiesen; `isJSXStart` nicht importiert; `RegExp.escape` nötig; `//`-Skip doppelt
- `1_lexer/index_new.js`: `import Lexer as LexerClass`, `'|'` statt `;`, `default export`
- `2_parser/*`: fehlende Imports (`parsed`, `ASTNode`, `operators`, `pushState`, `peek`, `isEOF` …), `expoet function`, Zirkularimporte zu nicht exportierten Funktionen
- `2_parser/statements.js`: `parseExpressionStatement` matcht `:` statt `;`; liefert `expr`, Node-Definition erwartet `expression`
- `2_parser/test.js`, `parser/_test.js`, `parser/nodes.js`: Konzept-/Pseudo-Code
- `parser/index.js`, `parser/methods.js`: `import default as`, `const tokens;`, doppelte `parseStatement`, Klammerfehler, doppelte `let declaration`
- `generator/*`: `'|'` statt `;`, `({ from, to )`, doppelte `generateCallExpression`, ungültiger "NEW"-Block, `generate`/`useHelper`-Imports falsch; `core.js` nicht in Factory; `generateLiteral` nutzt `type` statt `kind`
- `compiler-old`: `syntax/for.js` fehlt; `guard.js` (`;` im Ternary); `match.js` (`tupleRegey`, fehlende Klammer); `range.js` übergibt Funktionsnamen als String; zwei `export default` in `types.js`; `import * from 'ratscript'`
- `runtime/index.js` importiert aus `./types/`, Ordner heißt `builtin/`; `Trait`, `Type`, `Point`, Listen-Varianten nicht exportiert; `dom.js`, `reactivity.js` leer
- `runtime/helpers/_is.js`, `builtin/Union.js`, `builtin/ObjectList.js`: je zwei Fassungen mit doppeltem `export default`
- `builtin/Enum.js`, `Record.js`: Methode und Getter gleichen Namens (`names`/`values`, `keys`/`entries`)
- `builtin/Tuple.js`: `isTuple` nicht static, Parameter `stz` vs `sth`
- `builtin/List.js`: `toUnshifted` ruft `unshifted`; `with` gibt Array statt List zurück
- `builtin/List2.js`: Pseudo-Code in `zip`/`equals`
- `builtin/Struct.js`: Helper `isStruct = Enum.isEnum`
- `runtime/range.js`: mehrfach `function* range` deklariert
- `_assign.js`: Code nach `return` unerreichbar
- `examples/pwa-preact/app.rat`: `THEMES` doppelt, fehlende `)` bei `render`

Inkonsistenzen zwischen Quellen:
- Pipe-Platzhalter `#` (Doc/Old/Zed) vs `_` (P2/P3)
- Naked `switch` (Doc/Old) vs bewusst entfernt (P2/P3)
- `union`: Tagged (Old) vs Mitgliederliste (P2/P3)
- Keyword-Listen Old-meta / neue meta / Zed weichen voneinander ab (`cond`, `trait`, `guard`, `do`, `or`, `signal`, `effect`, `as`)
- `inc`-Präzedenz/Assoziativität
- Node-Namen `*Expression` vs `*Expr`
- Kommentarsprache gemischt Deutsch/Englisch
