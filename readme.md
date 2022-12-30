# Babel Sourcemap Repro

This repository demonstrates an issue with the Babel sourcemap generation.
I have reported this issue to Babel: https://github.com/babel/babel/issues/10869

I have run into this in https://github.com/TomasHubelbauer/cra-ast-localize
which uses source maps to figure out the string literals in JSX/TSX and replace
them with calls to localization functions.

## Running

```sh
cd repro
npm install
cd ..
npm install
npm start
```

## Updating dependencies

```
npm install @babel/cli @babel/core @babel/preset-env @babel/preset-react
cd repro
npm install source-map typescript
```

## Assessing the output

The `ln:col` ranges are translated and printed such that they match the numbers
shown in the caret position cell shows on the right of the VS Code status bar.

### Actual Output

```
App.js 10:16-10:20 > "test" < App.jsx 4:16-4:20
App.js 12:16-12:20 > "App" < App.jsx 6:20-6:19
App.js 13:60-13:87 > "Welcome to my application!" < App.jsx 7:8-7:36
App.js 13:91-13:107 > "This is my app!" < App.jsx 7:43-9:6
App.js 13:168-13:174 > "MINE." < App.jsx 9:8-9:19
```

### Expected Output

```
App.js 10:16-10:20 > "test" < App.jsx 4:16-4:20
App.js 12:16-12:20 > "App" < App.jsx 6:20-6:19
App.js 13:60-13:87 > "Welcome to my application!" < App.jsx 7:8-7:36
App.js 13:91-13:107 > "This is my app!" < App.jsx 7:43-9:6
App.js 13:168-13:174 > "MINE." < App.jsx 9:8-9:19
```

`App.js 10:16-10:20 > "test" < App.jsx 4:16-4:20` is mapped correctly.
This is the only string literal which is not a JSX/TSX child.
Other string literals which are be TSX/JSX node children are mapped incorrectly:

- `App.js 12:16-12:20 > "App" < App.jsx 6:20-6:19`
  - `App.js` should be 12:17-12:20
    - Start position is offset to the left by 1
    - End position is correct
  - `App.jsx` should be 6:21-6:24
    - Start posiition is offset to the left by 1
    - End position is completely bonkers
  - This is a JSX/TSX attribute value not a text child
- `App.js 13:60-13:87 > "Welcome to my application!" < App.jsx 7:8-7:36`
  - `App.js` should be 13:61-13:87
    - Start position is offset to the left by 1 (tag name length is 2)
    - End position is correct
  - `App.jsx` should be 7:11-7:37
    - Start position is offset to the left by 3
    - End position is offset to the left by 1
  - This is a JSX/TSX text child not an attribute value
- `App.js 13:91-13:107 > "This is my app!" < App.jsx 7:43-9:6`
  - `App.js` should be 13:92-13:107
    - Start position is offset to the left by 1
    - End position is correct
  - `App.jsx` should be 8:7-8:22
    - The string literal's text doesn't contain leading and trailing whitespace
    - The string literal's mapping does contain leading and trailing whitespace
- `App.js 13:168-13:174 > "MINE." < App.jsx 9:8-9:19`
  - `App.js` should be 13:169-13:174
    - Start position is offset to the left by 1
    - End position is offset to the left by 1
  - `App.jsx` should be 9:15-9:20
    - Start position is offset to the left by 7 (tag name length is 6)
    - End position is offset to the left by 1

We see that:

- Non-JSX/TSX string literals are mapped perfectly
- JSX/TSX attribute values show incorrect end position
- JSX/TSX tech childrens' positions are offset by varying amounts
  It seems that tag name and whitespace play a role but I have not been able to
  find a more precise pattern in the output data.
