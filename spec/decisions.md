# RatScript – Entscheidungen (Triage der Bestandsaufnahme)

Bezug: `spec/inventory.md`. Wird fortlaufend ergänzt, Grundlage für die Neu-Spezifikation.

---

## Grundsatz: Abweichungen von JS

- RS darf die Bedeutung von gültigem JS ändern, wenn das JS-Verhalten praktisch nie gewollt ist
- jede solche Abweichung ist dokumentiert
- wo der Compiler sie erkennen kann, warnt er
- bisherige Fälle: `+=` mit Array/Set/Map/Object/List links, `+=` mit `undefined`/`null` links, Schleifenbindung ohne Keyword

## Bleibt (Teil des Gesamtkonzepts)

- Builtin-Datentypen: `List`, `Enum`, `Union`
- `$()` + reaktive Datentypen
- Pipe-Operator `|>`
- Operator `is`
- Operator `+=` (universell)
- Keyword `proxy`
- Keyword `fn`
- Named Arguments
- `try` / `catch` / `finally` Kurzform-Sugar
- Prototype Accessor `::`
- Reaktivität nur über `$(…)`, kein `$`-Präfix für Variablen

## Bleibt, unsicher (muss sich in der Praxis zeigen)

- Range-Literal `..`

## Unsicher, ob etwas dagegen spricht

- Naked Loop `for (1..10)`, auch `for (10)`

## Form festgelegt

- `+=`: funktioniert überall, wo Anfügen/Zuweisen sinnvoll ist; Strings/Numbers bleiben wie in JS; links `undefined`/`null` → Ergebnis ist rechte Seite (`let s; s += 'a'` → `'a'`)
- `|>`: Platzhalter `_` (nicht `@`, wegen Decorators)
- `for (10)` = zehnmal, `for (i of 10)` → `i` läuft 1–10
- Schleifenbindung ohne Keyword: `for (name of …)` bindet IMMER ein neues `let` im Schleifen-Scope (nur bei nacktem Bezeichner; `for (obj.x of …)`, `for (const x of …)` bleiben JS). Compiler warnt, wenn `name` eine äußere Variable verdeckt
- `List`: eigene Klasse, `extends Array`
- `as` im Destructuring: nur zum Umbenennen, `{ a as b }`, auch mit Default `{ a as b = 1 }`; gilt überall, wo Destructuring vorkommt (Deklaration, Zuweisung, Parameter, Schleifenkopf); Verschachtelung bleibt JS-Form `{ a: { x } }`
- Literale: `#[…]` → `List`, `#(…)` → `Tuple`, `#{…}` → `Record`; `#` heißt "RS-Builtin", nicht "unveränderlich"
- Vergleich: `===` bleibt Referenzvergleich, struktureller Vergleich über `is` bzw. `.equals()`
- `Union`: Liste erlaubter Werte, `new Union(a, b, c)`; kein Literal vorerst (`|` kollidiert mit bitweisem OR)
- `proxy`: reiner Sugar für JS-`Proxy`; Form `proxy Name for target { … }`; Kurzformen `get x : wert` (Getter liefert Konstante), `fn x : wert` (Methode liefert Konstante)
- kein eigenes `Struct`-Konzept; Schema-Aufgaben (falls nötig) übernimmt Record selbst

## Wird anders

- Multiline Strings: statt ```` ``` ````-Syntax evtl. eingebaute Tag-Function, die Dedent etc. sauber leistet
- JSX: zuerst Integration der eigenen HTX-Syntax; danach ggf. Fähigkeit, JSX u.ä. einbinden zu können
- `cond`: fliegt in der jetzigen Form, Thema wird neu konzipiert
- Alternative `import`/`export`-Syntax: bleibt als Ziel, Form noch offen

## Kommt weg

- eigenes Keyword `signal`
- eigenes Keyword `effect`
- eigenes Keyword `stylesheet`
- `match`, `switch`, `sift`, `mold` (Thematik bleibt wichtig, wird neu konzipiert)
- bisherige Assignment Guards und Line Guards
- Operator `inc`

## Bleibt Scratch

- Direktiven `_:"…"`
- Typ-Signatur `::`

---

## Noch offen (nicht triagiert)

### Syntax
- `proxy`: Bedeutung von `static`, weitere Traps (`set`, `has`, `delete`, …), `this` in Methoden

### Zurückgestellt
- `enum`-Syntax, `trait` / `use`, `or`, `alias`, `as`-Binding in `if` / `while`

### Semantik bestehender Entscheidungen
- `|>`: implizite Formen (`x |> f`, `x |> f()`, `x |> f(a)`)
- `Record` / `Tuple`: erst mal eigene Datenstruktur, nicht per se unveränderlich; offen: Sealing (feste Keys/Länge), Freezing, Schema-Bindung (Typen, Defaults), nominale Bindung an einen Namen (`rec is User`), Syntax für Schema-Bindung; Klärung über Praxis. Vorschlag v1: `#{…}` sealed, `#(…)` feste Länge (strenger Start lässt sich später lockern, ohne Code zu brechen)
- `is`: Umfang (Konstruktoren, Klassen, Prädikate, Deep-Shape-Matching, Union-Varianten, Traits)
- `List`: Typisierung per `typeof`, `toX`-Klon-Schema, Unterklassen (`NumberList`, `StringList`, `ObjectList`, `RecordList`)
- `Enum`: API-Umfang
- reaktive Typen: welche (`$Map`, `$Set`, `$Date`, `$String`, `$Number`, `$Point`, `$Time`, `$localStorage`, …), Bindung an `@preact/signals` oder eigene Signals

### Builtins
- `Tuple`
- `Record`
- `Type`
- `Point`

### Compiler / Projekt
- Anspruch: vollständiges JS-Superset oder JS-Teilmenge + Erweiterungen
- Basis: eigenständig vs `@cosmonaut/*`
- Pipeline: Lexer → Parser → (Transformer) → Generator
- Runtime-Strategie: Helper-Imports (`_fn`, `_is`, `_assign`, …) vs Inline-Code
- Zielplattform / Distribution: Deno, JSR, npm
- Dateiendung `.rat`
- Tooling: CLI, Language Server, Zed-Extension
