const klaw = require('klaw');
const fs = require('fs-extra');
const sourcemap = require('source-map');
const ts = require('typescript');
const { relative } = require('path');

void async function () {
  for await (const file of klaw('lib')) {
    if (!file.stats.isFile()) {
      continue;
    }

    if (!file.path.endsWith('.js')) {
      continue;
    }

    let sourceMap;
    try {
      sourceMap = await new sourcemap.SourceMapConsumer(String(await fs.readFile(file.path + '.map')));
    }
    catch (error) {
      // Ignore files without sourcemaps
      continue;
    }

    const sourceText = String(await fs.readFile(file.path));
    const sourceFile = ts.createSourceFile(
      file.path,
      sourceText,
      ts.ScriptTarget.ES5, // tsconfig.json
      true
    );

    const target = relative(process.cwd(), file.path);

    const nodes = [sourceFile];
    do {
      const node = nodes.shift();
      nodes.unshift(...node.getChildren());
      if (node.kind === ts.SyntaxKind.StringLiteral) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.pos);
        const map = sourceMap.originalPositionFor({ line: line + 1, column: character });
        if (map.source === null) {
          continue;
        }

        console.log(`${JSON.stringify(node.text)} (${node.text.length})`);
        const { line: lineEnd, character: characterEnd } = sourceFile.getLineAndCharacterOfPosition(node.end);
        const mapEnd = sourceMap.originalPositionFor({ line: lineEnd + 1, column: characterEnd });
        const source = map.source.startsWith('../') ? map.source.slice('../'.length) : map.source;
        console.log(`  source: ${source}:${map.line}:${map.column + 1} - ${source}:${mapEnd.line}:${mapEnd.column + 1} | ${map.line !== mapEnd.line ? 'multiline' : mapEnd.column - map.column}`);
        console.log(`  target: ${target}:${line + 1}:${character + 1} - ${target}:${lineEnd + 1}:${characterEnd + 1} | ${line !== lineEnd ? 'multiline' : characterEnd - character}`);
      }
    } while (nodes.length > 0);

    const sourceLines = sourceText.split(/\n/g);
    for (let line = 0; line < sourceLines.length; line++) {
      for (let character = 0; character < sourceLines[line].length; character++) {
        const original = sourceMap.originalPositionFor({ line: line + 1, column: character + 1 });
        const generated = sourceMap.generatedPositionFor({ line: original.line, column: original.column, source: original.source });
        console.log(`${target}:${line + 1}:${character + 1} | ${original.line}:${original.column} | ${generated.line}:${generated.column}`);
      }
    }
  }
}()
