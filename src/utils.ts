import {ModuleKind, ModuleResolutionKind, ScriptTarget, transpileModule} from "typescript";
import {readFileSync} from "fs";
import {resolve} from "node:path";

export function parseArguments(requiredParameters: string[] = [], argvIndex = 2): Map<string, string> {
  const argMap: Map<string, string> = new Map();
  process.argv.slice(argvIndex).forEach((arg) => {
    const [key, value] = arg.split('=');
    argMap.set(key, value);
  });
  for (const requiredParameter of requiredParameters) {
    if (!argMap.has(requiredParameter)) {
      throw new Error(`${requiredParameter} is required`);
    }
  }
  return argMap;
}

export function transpileInMemory<T = any>(file: string): T {
  return eval(transpileModule(readFileSync(file, 'utf-8'), {
    compilerOptions: {
      target: ScriptTarget.ES2016,
      module: ModuleKind.CommonJS,
      moduleResolution: ModuleResolutionKind.NodeJs,
      resolveJsonModule: true,
      sourceMap: false,
      noImplicitAny: false,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      esModuleInterop: true,
      declaration: true,
      allowJs: true,
      noLib: true,
      noResolve: true,
      isolatedModules: true,
    },
  }).outputText);
}