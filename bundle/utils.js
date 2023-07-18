"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArguments = void 0;
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
//# sourceMappingURL=utils.js.map