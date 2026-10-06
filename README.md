![Logo](https://raw.githubusercontent.com/Pulgasari/aufbau/refs/heads/main/svg/logos/ratscript.svg)

# RatScript

## About

**RatScript** is an experimental project which I created out of curiousity.

I do love **JavaScript** because it is such an awkward weirdo. And yeah, it's okay to make fun about it because it's all (mostly) true.

A while ago I became interested in Programming Language design and was looking into that topic more deeply as I ever had done before. I started to understand why some patterns exist which often annoyed me while coding. (Not only in JS but in general.)

What **Ratscript** is not: It's not an attempt to "fix JavaScript" or even replace it (like other projects tried before).

### So, what does RatScript offer?

- improved syntax which i enjoy
- improved control flow which i enjoy
- several builtins which i enjoy
- pattern matching
- jsx-support

---

## import

```js
import from '@aufbau/signals' as { effect, signal };
```

```js
imports {
  '@aufbau/signals' : { effect, signal },
  '@htx/compiler'   : bla,
}
```


```js
// ohne keyword -> implizit 'const'
a = () => ...;
b = () => ...;
c = () => ...;

export *;
export * as default; // selbes muster gibts beim import bereits

export { a, b as doSth, c };
export default c;
```

##

```js
 [a, b, c]; // Array
#[a, b, c]; // List
S[a, b, c]; // Set
$[a, b, c]; // $Array

 {...}
#{...}

P(...) // Point
V(...) // Vector

a | b | c // Unin
```

### das bleibt bzw. teil des gesamtkonzeptes:
- `${}` + reaktive datentypen
- pipe-operator `|>`
- operator `is`
- operator `+=`
- keyword `proxy`
- keyword `fn`
- named arguments
- try / catch / finally kurzform sugar

### das bleibt, aber bin unsicher (wird wohl der praxis bedürfen):
- literal für Range `..`

### das is anders:
- für multiline strings würde evtl ne eingebaute tag funnction reichen, die das sauber leistet
- statt JSX gehts mir ersma um fie integration meines eigenen HTX syntax (danach aber eventuelle fähigkeit auch JSX u.ä. handy integrieren zu können)
- `cond` weg aber das thema versuchen neu zu konzipieren

### das kommt weg:
- eigenes keyword für signal
- eigenes keyword für effect
- eigenes keyword für stylesheet
- match, switch, sift, mold (thematik bleibt wichtig, aber wird neu konzipiert)
- bisherige assignment- und line-guards konzepte
- operator: `inc`

### das war nur scratch und bleibt es:
- direktiven mit `_:''`
- type signatur `::`

###
- `@aufbau/signals`
- `@pulgasari/shift`
- `@pulgasari/typeshift`

