[![travis](http://img.shields.io/travis/belozer/objects-packer.svg?style=flat-square)](https://travis-ci.org/belozer/objects-packer)

Objects Packer
==============

Save your object links equal server and client states

### Short example

```js
// Server
const dataA = {};
const dataB = { a: dataA, b : dataA };

const packer = new Packer();
packer.take(dataB);

const json = JSON.stringify(packer.pack);
```

```js
// Browser
const packer = new Packer(JSON.parse(json));
const data = packer.get(0);
data.a === data.b; // true
```

### Named stores
```js
// Server
const dataA = {};
const dataB = { a: dataA, b : dataA };

const packer = new Packer();
packer.take(dataB, 'myStore1');
packer.take(dataA, 'myStore2');

const json = JSON.stringify(packer.pack);
```

```js
// Browser
const packer = new Packer(JSON.parse(json));
const myStore1 = packer.give('myStore1');
myStore1.a === myStore1.b; // true

const myStore2 = packer.give('myStore2'); // Deep equal dataA
```

## IMPORTANT!

You can `give` as many times as you `take` for same store.
This is feature for cleaning store in runtime for stop memory leaks.

### Example
```js
const data = {};
packer.take(data); // returns pos 0
packer.take(data); // returns pos 0

packer.give(0); // returns data
packer.give(0); // returns data
packer.give(0); // returns null
```
