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
