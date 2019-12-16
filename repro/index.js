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

    const sourceFile = ts.createSourceFile(
      file.path,
      String(await fs.readFile(file.path)),
      ts.ScriptTarget.ES5, // tsconfig.json
      true
    );

    const nodes = [sourceFile];
    do {
      const node = nodes.shift();
      nodes.unshift(...node.getChildren());
      if (node.kind === ts.SyntaxKind.StringLiteral) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.pos);
        const map = sourceMap.originalPositionFor({ line: line + 1, column: character });
        console.log(JSON.stringify(node.text));
        let source = map.source || '';
        if (source.startsWith('../')) {
          source = source.slice('../'.length);
        }

        console.log(`  source: ${source}:${map.line}:${map.column + 1}`);
        console.log(`  target: ${relative(process.cwd(), file.path)}:${line + 1}:${character + 1}`);
      }
    } while (nodes.length > 0);
  }
}()
