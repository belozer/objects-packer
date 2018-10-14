Objects Packer
==============

Save your object links between server and client states

### Short example:

```js
// Server
const dataA = {};
const dataB = { a: dataA, b : dataA };

const packer = new Packer();
packer.take(dataB);

const jsonString = packer.toString();

// Browser
const unpacked = new Packer(jsonString).unpack();
unpacked.a === unpacked.b; // true
```
