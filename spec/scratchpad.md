# scratchpad.md

```javascript
:: person = String Number
fn person = (name, age) => console.log(`${name} is ${age} years old.);
```

```javascript
// 1. Client-Only / Server-Only Markers
_:"client";
function onClick() {
  // Preprocessor moves this to client bundle only
}

// 2. Scoped CSS or Injection Tag
_:"css: .card { color: red; }";

// 3. Reactive State Directive
_:"signal"; let count = 0;
```

## reactive variants

```javascript
import { signal } from '@preact/signals';

export class $Map extends Map {
  // Internal signal to trigger reactivity on changes
  #version = signal(0);

  get(key) {
    // Read signal to register dependency in Preact
    this.#version.value;
    return super.get(key);
  }

  set(key, value) {
    super.set(key, value);
    // Notify subscribers
    this.#version.value++;
    return this;
  }
}
```

```javascript
import { signal } from '@preact/signals';

// Helper function to create reactive objects
export function $object(initialData = {}) {
  const version = signal(0);

  return new Proxy(initialData, {
    get(target, prop) {
      // Accessing signal value registers subscriber
      version.value;
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      // Mutating property triggers reactive updates
      version.value++;
      return true;
    }
  });
}

// Usage:
const user = $object({ name: 'Alice' });

// In template / reactive effect:
console.log(user.name); // Registers dependency

// Mutation:
user.name = 'Bob'; // Triggers reactive update automatically
```



```javascript
import { signal } from '@preact/signals';

export class $Date extends Date {
  #version = signal(0);

  // Overriding getters to register dependency
  getTime() {
    this.#version.value;
    return super.getTime();
  }

  // Overriding mutators to trigger reactive updates
  setTime(time) {
    const res = super.setTime(time);
    this.#version.value++;
    return res;
  }

  setHours(...args) {
    const res = super.setHours(...args);
    this.#version.value++;
    return res;
  }
}

// Usage:
const now = new $Date();
console.log(now.getTime()); // Registers dependency

now.setHours(12); // Triggers update!
```

```javascript
import { signal } from '@preact/signals';

class ReactiveStorage {
  #signals = new Map();

  #getSignal(key) {
    if (!this.#signals.has(key)) {
      // Initialize signal with current storage value
      this.#signals.set(key, signal(localStorage.getItem(key)));
    }
    return this.#signals.get(key);
  }

  constructor() {
    // Listen to changes made in OTHER tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key && this.#signals.has(event.key)) {
        this.#signals.get(event.key).value = event.newValue;
      }
    });
  }

  // Proxy wrapper to allow direct property access like $localStorage.theme
  createProxy() {
    return new Proxy(this, {
      get: (target, prop) => {
        if (typeof prop === 'string' && !(prop in target)) {
          return target.#getSignal(prop).value;
        }
        return target[prop];
      },
      set: (target, prop, value) => {
        if (typeof prop === 'string') {
          const strVal = String(value);
          localStorage.setItem(prop, strVal);
          target.#getSignal(prop).value = strVal;
          return true;
        }
        return false;
      }
    });
  }
}

export const $localStorage = new ReactiveStorage().createProxy();
```

#### primitibe problems

```javascript
// 1. Typ-Unterschied (typeof)
​JavaScript ordnet beide zwei völlig verschiedenen Datentypen zu:

let a = new String("hallo");
let b = "hallo";

console.log(typeof b); // "string"
console.log(typeof a); // "object"

// 2. Vergleich bei Gleichheit (===)
​Beim strikten Vergleich (===) vergleicht JS bei Primitives die Werte, bei Objekten hingegen die Referenz im Speicher:

let a = new String("hallo");
let b = "hallo";

console.log(b === "hallo"); // true
console.log(a === "hallo"); // false (object vs string primitive)

// Comparing two String objects vs two primitives
console.log("hallo" === "hallo"); // true
console.log(new String("hallo") === new String("hallo")); // false! (two different object references)

// 3. Truthy vs. Falsy (Gefährliche Falle!)
​Ein leerer String "" ist in JS ein falsy Wert. Ein Objekt – egal welches – ist in JS jedoch immer truthy!

let emptyPrimitive = "";
let emptyObject = new String("");

if (emptyPrimitive) {
  // Will NOT execute because "" is falsy
}

if (emptyObject) {
  // WILL EXECUTE! Because any object in JS is truthy
  console.log("This runs even though the string is empty!");
}

// 4. Dynamische Eigenschaften (Objekt-Verhalten)
let a = new String("hallo");
let b = "hallo";

// Try to set a custom property
b.myProp = "test";
a.myProp = "test";

console.log(b.myProp); // undefined
console.log(a.myProp); // "test"
```

####

```javascript
import { signal } from '@preact/signals';
import { $Map } from './reactive-map.js';
import { $Date } from './reactive-date.js';

// Polyfilled/universal constructor factory
export function $(initialValue) {
  // Allow calling with or without 'new'
  if (!(this instanceof $)) {
    return new $(initialValue);
  }

  // 1. Primitives (string, number, boolean) -> Return Preact Signal
  if (typeof initialValue !== 'object' || initialValue === null) {
    return signal(initialValue);
  }

  // 2. Maps -> Return $Map
  if (initialValue instanceof Map) {
    return new $Map(initialValue);
  }

  // 3. Dates -> Return $Date
  if (initialValue instanceof Date) {
    return new $Date(initialValue);
  }

  // 4. Objects & Arrays -> Return Proxy
  return createReactiveProxy(initialValue);
}
```

##### example 1

```javascript
// Input in .htx (100% valid JS)
let name = new $('Udo');
name = 'Peter';

// Preprocessor Output
const name = signal('Udo');
name.value = 'Peter'; // Compiler automatically adds .value on assignment/read

```

##### example 2

```javascript
// Input in .htx
const user = new $({ name: 'Udo' });
const items = new $(new Map());

// Preprocessor Output (no .value transformation needed, methods/proxies handle it)
const user = createReactiveProxy({ name: 'Udo' });
const items = new $Map();
```
