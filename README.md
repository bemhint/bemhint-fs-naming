# bemhint-fs-naming

Plugin for [bemhint](https://github.com/bemhint/bemhint) which finds files written not in BEM notation.

## Config example

```js
module.exports = {
    levels: [
        '*.blocks'
    ],

    excludePaths: [
        'node_modules/**'
    ],

    plugins: {
        'bemhint-fs-naming': true
    }
}
```
