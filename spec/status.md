# RatScript – Umsetzungsstand

## Aufbau

- `packages/compiler` (`@ratscript/compiler`): acorn + RatScript-Plugin → Transforms → astring
  - `src/parser.js`: Grammatik-Erweiterungen (acorn-Plugin)
  - `src/walk.js`, `src/scope.js`: Baum-Transform mit Scope-Tracking
  - `src/transforms/*.js`: ein Modul pro Feature-Gruppe
  - API: `compile(source, { filename, runtime, sourceType }) → { code, warnings }`
- `packages/runtime` (`@ratscript/runtime`, `@ratscript/runtime/reactive`): Builtins und Helper, die der Compiler aufruft
- `_archive/`: alter Code (Regex-Compiler, P2/P3-Parser, alte Runtime, Beispiele)
- `examples/features.rat`: alle umgesetzten Features in einer Datei

## Umgesetzt

| Feature | Syntax | Ausgabe |
|---|---|---|
| Pipe | `x \|> f`, `x \|> f(a)`, `x \|> f(a, _)` | `f(x)`, `f(a)(x)`, `f(a, x)` |
| `+=` | `list += x`, `const set += x`, `o.k += x` | `add`, `append`, `addTo` |
| `fn` | `fn name (a, b) {}`, `async fn`, `fn*`, `fn (…) {}` | `function` + `params(name, ['a', 'b'])` |
| Named Arguments | `f(1, b: 2)`, `o.m(b: 2)`, `new C(b: 2)` | `call`, `callMethod`, `construct` |
| try-Kurzformen | `try x();`, `try x() catch (e) y();`, Einzeiler für alle Klauseln | `try {…} catch {}` |
| Literale | `#[…]`, `#(…)`, `#{…}` | `List.from`, `Tuple.from`, `Record.from` |
| Typisierte List | `new List of String ('a')` | `typed(List, String, [...])` |
| `is` | `x is Pattern` | `is(x, Pattern)` |
| Range | `1..10`, `'a'..'z'`, `10..1` | `range(…)` → `Range` (inklusiv, wiederverwendbar) |
| Naked Loop | `for (10)`, `for (1..3)`, `for (list)` | `for (const _ of iter(…))` |
| Loop-Bindung | `for (i of 10)` | `for (let i of iter(10))`, Warnung bei Verdeckung |
| Prototype Accessor | `String::shout`, `fn String::shout () {}` | `String.prototype.shout` |
| `as` | `const { a as b, c as d = 1 } = o` | `{ a: b, c: d = 1 }` |
| `proxy` | `proxy P for target { get x : v; set y (v) {} fn z () {} }` | `proxy(target, { get, set, fn })` |
| Reaktivität | `$(value)`, `effect`, `computed`, `batch`, `untracked` | `@ratscript/runtime/reactive` |
| Auto-Import | freie Referenzen auf `List`, `Range`, `Record`, `Tuple`, `Union`, `$…`, `effect` … | Import aus der Runtime |

## `is`-Patterns (Stufe 1)

- Konstruktoren `String`, `Number`, `Boolean`, `BigInt`, `Symbol`, `Function`, `Object`, `Array` → Typprüfung
- Klassen → `instanceof`
- Funktionen ohne Klassen-Charakter → Prädikat
- RegExp → String passt
- `Union`, `Range` → Mitgliedschaft
- `List`, `Tuple`, `Record` → strukturelle Gleichheit
- Array-Literal `[String, Number]` → positionale Form
- Objekt-Literal `{ name: String }` → Shape, verschachtelt
- sonst `Object.is`

## Abweichungen von JS (dokumentationspflichtig)

- `+=` auf Array/Set/Map/Object/List fügt an; links `undefined`/`null` ergibt die rechte Seite
- `for (name of …)` bindet immer ein neues `let`
- `for (… of zahl)` iteriert 1..zahl (in JS ein TypeError)
- `fn` ist an Funktionsposition ein Keyword: `fn (…) {…}` ist eine Funktion, eine Variable `fn` kann man nicht mehr direkt aufrufen
- `1..toString()` ist jetzt eine Range, kein Methodenaufruf auf `1.`
- `is` ist in Infix-Position ein Operator (als Bezeichner sonst weiter nutzbar)
- `::` ist ein eigenes Token
- freie Referenz `$` wird aus der Runtime importiert (kollidiert mit globalem jQuery-`$`)

## Bekannte Grenzen

- Kommentare und Formatierung gehen verloren (astring erzeugt neu), keine Source Maps
- `x |> f(a)` wertet `f(a)` vor `x` aus
- `_` ist nur als direktes Argument im Pipe-Schritt Platzhalter
- `+=` läuft immer über einen Helper, auch bei Zahlen in heißen Schleifen
- typisierte List: Index-Zuweisung `list[0] = x` wird nicht geprüft, Ergebnisse von `map`/`filter` sind untypisiert
- Named Arguments bei fremden (Nicht-`fn`-)Funktionen lesen die Parameternamen aus `toString()`, nach Minifizierung unzuverlässig
- `get x : { … }` ist immer ein Getter-Körper; ein Objekt als Konstante braucht Klammern `get x : ({ … })`
- Proxy-Konstanten werden bei jedem Zugriff neu ausgewertet
- reaktive Objekte/Arrays sind flach; `$Bool`/`$Number`/`$String` sind als Objekte immer truthy, geprüft wird `.value`
- `for (… of x)` umhüllt die rechte Seite mit `iter(x)`, außer bei offensichtlichen Iterables
- noch kein CLI, keine Tests
