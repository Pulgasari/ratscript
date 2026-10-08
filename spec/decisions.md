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

## Bleibt, unsicher (muss sich in der Praxis zeigen)

- Range-Literal `..`

## Unsicher, ob etwas dagegen spricht

- `as` im Destructuring
- Literal-Syntax `#[…]`, `#(…)`, `#{…}`
- Naked Loop `for (1..10)`, auch `for (10)`

## Form festgelegt

- `+=`: funktioniert überall, wo Anfügen/Zuweisen sinnvoll ist; Strings/Numbers bleiben wie in JS; links `undefined`/`null` → Ergebnis ist rechte Seite (`let s; s += 'a'` → `'a'`)
- `|>`: Platzhalter `_` (nicht `@`, wegen Decorators)
- `for (10)` = zehnmal, `for (i of 10)` → `i` läuft 1–10
- Schleifenbindung ohne Keyword: `for (name of …)` bindet IMMER ein neues `let` im Schleifen-Scope (nur bei nacktem Bezeichner; `for (obj.x of …)`, `for (const x of …)` bleiben JS). Compiler warnt, wenn `name` eine äußere Variable verdeckt
- `List`: eigene Klasse, `extends Array`

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
- `alias … as …` / `alias x = …`
- `as`-Binding in `if` / `while`
- `trait` / `use` (Klassen, Funktionen, Objekte)
- `or` als Alias für `||`
- Syntax für `enum` (Keyword?) und `union` (Form?)
- `proxy`: `for` vs `of`, Member-Kurzformen (`get x : value`, `fn x : value`)
- `$`-Präfix-Konvention für reaktive Variablen (autom. `.value`)

### Semantik bestehender Entscheidungen
- `|>`: implizite Formen (`x |> f`, `x |> f()`, `x |> f(a)`)
- `#{…}`: wofür
- `is`: Umfang (Konstruktoren, Klassen, Prädikate, Deep-Shape-Matching, Union-Varianten, Traits)
- `Union`: Mitglieds-Union vs Tagged Union (oder beides)
- `List`: Typisierung per `typeof`, `toX`-Klon-Schema, Unterklassen (`NumberList`, `StringList`, `ObjectList`, `RecordList`)
- `Enum`: API-Umfang
- reaktive Typen: welche (`$Map`, `$Set`, `$Date`, `$String`, `$Number`, `$Point`, `$Time`, `$localStorage`, …), Bindung an `@preact/signals` oder eigene Signals

### Builtins
- `Tuple`
- `Struct` / `Record`
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
