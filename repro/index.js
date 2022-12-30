import fs from 'fs';
import sourcemap from 'source-map';
import typescript from 'typescript';

for (const path of await fs.promises.readdir('lib')) {
  if (!path.endsWith('.js')) {
    continue;
  }

  const sourceMap = await new sourcemap.SourceMapConsumer(await fs.promises.readFile(`lib/${path}.map`, 'utf-8'));
  const file = typescript.createSourceFile(
    path,
    await fs.promises.readFile(`lib/${path}`, 'utf-8'),
    typescript.ScriptTarget.ESNext,
    /* setParentNodes: */ true,
    typescript.ScriptKind.JS
  );

  const nodes = [file];
  do {
    const node = nodes.shift();
    nodes.unshift(...node.getChildren());
    if (node.kind === typescript.SyntaxKind.StringLiteral) {
      const { line: lineStart, character: characterStart } = file.getLineAndCharacterOfPosition(node.pos);
      const { line: lineEnd, character: characterEnd } = file.getLineAndCharacterOfPosition(node.end);

      const startMap = sourceMap.originalPositionFor({ line: lineStart + 1, column: characterStart });
      const endMap = sourceMap.originalPositionFor({ line: lineEnd + 1, column: characterEnd });
      
      if (!startMap.source || !endMap.source) {
        // Skip extra non-user literals like `use strict` and `__esModule`
        continue;
      }

      if (startMap.line === endMap.line && startMap.column === endMap.column) {
        // Skip mis-mapped non-user literals like `import React from "react"`
        continue;
      }

      const jsPath = path;
      const jsxPath = startMap.source.slice(startMap.source.lastIndexOf('/') + 1);

      // Note that positions are translated and printed to match the values VS
      // Code shows caret positions in the `Ln, Col` cell on the right side of
      // its status bar

      // TODO: Fix offset indices of string literals which are in JSX/TSX nodes
      const jsVsCodeLineStart = lineStart + 1;
      const jsVsCodeCharacterStart = characterStart + 2;
      const jsVsCodeLineEnd = lineEnd + 1;
      const jsVsCodeCharacterEnd = characterEnd;
      const jsxVsCodeLineStart = startMap.line;
      const jsxVsCodeCharacterStart = startMap.column + 2;
      const jsxVsCodeLineEnd = endMap.line;
      const jsxVsCodeCharacterEnd = endMap.column;

      console.log(`${jsPath} ${jsVsCodeLineStart}:${jsVsCodeCharacterStart}-${jsVsCodeLineEnd}:${jsVsCodeCharacterEnd} > "${node.text}" < ${jsxPath} ${jsxVsCodeLineStart}:${jsxVsCodeCharacterStart}-${jsxVsCodeLineEnd}:${jsxVsCodeCharacterEnd}`);
    }
  }
  while (nodes.length > 0);
}
