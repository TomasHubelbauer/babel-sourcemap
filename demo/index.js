import fs from 'fs';
import sourcemap from 'source-map';
import typescript from 'typescript';

for (const path of await fs.promises.readdir('lib')) {
  if (!path.endsWith('.js')) {
    continue;
  }

  const sourceMap = await new sourcemap.SourceMapConsumer(await fs.promises.readFile(`lib/${path}.map`, 'utf-8'));
  const sourceFile = typescript.createSourceFile(path, await fs.promises.readFile(`lib/${path}`, 'utf-8'));

  function makeTransformer(/** @type {typescript.TransformationContext} */ context) {
    return function visit(/** @type {typescript.Node} */ node) {
      return typescript.visitNode(node, node => {
        if (node.kind !== typescript.SyntaxKind.StringLiteral) {
          return typescript.visitEachChild(node, visit, context);
        }

        const { line: lineStart, character: characterStart } = sourceFile.getLineAndCharacterOfPosition(node.pos);
        const { line: lineEnd, character: characterEnd } = sourceFile.getLineAndCharacterOfPosition(node.end);
  
        const startMap = sourceMap.originalPositionFor({ line: lineStart + 1, column: characterStart });
        const endMap = sourceMap.originalPositionFor({ line: lineEnd + 1, column: characterEnd });
        
        if (!startMap.source || !endMap.source) {
          // Skip non-user string literals like `use strict` and `__esModule`
          return node;
        }
  
        if (startMap.line === endMap.line && startMap.column === endMap.column) {
          // Skip non-text string literals like `import React from "react"`
          return node;
        }

        console.log(`Transformed "${node.text}" in ${sourceFile.fileName}…`);
        return context.factory.createStringLiteral(`TEST >> ${node.text} << TEST`);
      });
    }
  }

  const { transformed: [targetFile] } = typescript.transform(sourceFile, [makeTransformer]);
  await fs.promises.writeFile(`lib/${path}`, typescript.createPrinter().printFile(targetFile));
}
