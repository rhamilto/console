import * as findUp from 'find-up';
import * as _ from 'lodash';
import * as tsj from 'ts-json-schema-generator';
import * as tsu from 'tsutils';
import * as ts from 'typescript';
import { resolvePath, relativePath } from './path';

const formatDiagnostics = (diagnostics: readonly ts.Diagnostic[], currentDirectory: string) =>
  ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => currentDirectory,
    getCanonicalFileName: _.identity,
    getNewLine: () => ts.sys.newLine,
  });

export const getSchemaGeneratorConfig = (srcFile: string, typeName?: string): tsj.Config => ({
  path: resolvePath(srcFile),
  type: typeName,
  tsconfig: findUp.sync('tsconfig.json'),
  topRef: false,
  jsDoc: 'extended',
  skipTypeCheck: true,
});

export const getProgram = (config: tsj.Config): ts.Program => {
  const program = tsj.createProgram({ ...tsj.DEFAULT_CONFIG, ...config });

  const diagnostics = ts.sortAndDeduplicateDiagnostics(ts.getPreEmitDiagnostics(program));
  if (diagnostics.length > 0) {
    console.error(formatDiagnostics(diagnostics, program.getCurrentDirectory()));
  }

  const diagnosticsErrors = diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);

  if (diagnosticsErrors.length > 0) {
    throw new Error(
      // In practice this would never be undefined so we can ignore this warning
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `Detected errors while parsing ${relativePath(config.path!)}, ${String(diagnosticsErrors)}`,
    );
  }

  return program;
};

export const getProgramFromFile = (srcFile: string): ts.Program =>
  getProgram(getSchemaGeneratorConfig(srcFile));

export const getTypeAliasDeclaration = (node: ts.Node, aliasName: string) =>
  ts.forEachChild<ts.TypeAliasDeclaration>(node, (childNode) =>
    ts.isTypeAliasDeclaration(childNode) && childNode.name.getText() === aliasName
      ? childNode
      : undefined,
  );

export const getTypeReferenceNode = (node: ts.Node, typeName: string) =>
  ts.forEachChild<ts.TypeReferenceNode>(node, (childNode) =>
    ts.isTypeReferenceNode(childNode) && childNode.typeName.getText() === typeName
      ? childNode
      : undefined,
  );

export const getUnionMemberTypes = (typeChecker: ts.TypeChecker, node: ts.Node) => {
  const nodeType = typeChecker.getTypeAtLocation(node);
  return nodeType.isUnion() ? nodeType.types : [];
};

export const getJSDoc = (node: ts.Node): ts.JSDoc[] =>
  tsu.canHaveJsDoc(node) ? tsu.getJsDoc(node) : [];

export const hasDeprecationJSDoc = (node: ts.Declaration): boolean => {
  return getJSDoc(node).some((d) => d.tags && d.tags.find((t) => t.tagName.text === 'deprecated'));
};

const getCommentText = (comment: string | ts.NodeArray<ts.JSDocComment>): string => {
  return typeof comment === 'string'
    ? comment
    : comment
        .filter((c) => c.kind === ts.SyntaxKind.JSDocText)
        .map((c) => c.text)
        .join('\n');
};

export const getJSDocComments = (node: ts.Declaration): string[] => {
  return _.compact(
    getJSDoc(node).map((d) => {
      if (d.tags) {
        return d.tags
          .map((t) => `@${t.tagName.text} ${getCommentText(t.comment ?? '')}`)
          .join('\n');
      }

      return getCommentText(d.comment ?? '');
    }),
  );
};

export const printJSDocComments = (docComments: string[]) => docComments.join('\n\n').trim();
