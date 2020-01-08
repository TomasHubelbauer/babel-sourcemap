# Babel Sourcemap Repro

[**WEB**](https://tomashubelbauer.github.io/babel-sourcemap)

This repository demonstrates an issue with the Babel sourcemap generation.

To run:

```sh
cd repro
npm install
cd ..
npm install
npm start
```

In the output:

```
"div"
  source: src/App.jsx:5:5
  target: lib/App.js:13:39
"App"
  source: src/App.jsx:5:19
  target: lib/App.js:14:15
"h1"
  source: src/App.jsx:6:7
  target: lib/App.js:15:35
"Welcome to my application!"
  source: src/App.jsx:6:7
  target: lib/App.js:15:46
"This is my app!"
  source: src/App.jsx:5:5
  target: lib/App.js:15:77
"strong"
  source: src/App.jsx:8:7
  target: lib/App.js:15:126
"MINE."
  source: src/App.jsx:8:7
  target: lib/App.js:15:141
```

- `div` is mapped correctly
- `App` is mapped correctly
- `h1` is mapped correctly
- `Welcome to my application!` is mapped to the `h1`
- `This is my app!` is mapped to the `div`
- `strong` is mapped correctly
- `MINE.` is mapped to the `strong`

So, it appears that string literals which are used as JSX children are not getting
mapped to their correct respective source locations, instead, they are mapped to the
JSX element's tag name.

## To-Do

### Help resolve the GitHub issue

https://github.com/babel/babel/issues/10869
