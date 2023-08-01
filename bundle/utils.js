"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileInMemory = exports.parseArguments = void 0;
const typescript_1 = require("typescript");
const fs_1 = require("fs");
function parseArguments(requiredParameters = [], argvIndex = 2) {
    const argMap = new Map();
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
exports.parseArguments = parseArguments;
function transpileInMemory(file) {
    return eval((0, typescript_1.transpileModule)((0, fs_1.readFileSync)(file, 'utf-8'), {
        compilerOptions: {
            target: typescript_1.ScriptTarget.ES2016,
            module: typescript_1.ModuleKind.CommonJS,
            moduleResolution: typescript_1.ModuleResolutionKind.NodeJs,
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
exports.transpileInMemory = transpileInMemory;
//# sourceMappingURL=utils.js.map