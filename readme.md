# Babel Sourcemap Demo

This repository used to demonstrate a Babel string literal source mapping issue:
https://github.com/babel/babel/issues/10869.

The issue has been blocking https://github.com/TomasHubelbauer/cra-ast-localize
and has since been fixed so the repository has shifted to demonstrate a minimal
TypeScript transformer which visits all string literals and replaces their text
which is the purpose of the linked repository that was blocked by the issue.

## Running

First time setup:

```sh
cd demo
npm install
cd ..
npm install
```

Running the demo: `npm start`.

This will run Babel to transform the source code in `src` into the source code
in `lib` and then will run the demo script in `demo` which runs the TypeScript
tranformer.

The transformer changes the string literals in the files in `lib` so after the
`npm start` command has run, you can inspect them and see the additional `TEST`
markers surrounding the original strings that were added by the transformer.

## Updating dependencies

```
npm install @babel/cli @babel/core @babel/preset-env @babel/preset-react
cd demo
npm install source-map typescript
```
