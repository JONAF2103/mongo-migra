"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const index_1 = require("../../index");
const utils_1 = require("../../utils");
async function compile(args) {
    let configurationFile = (0, node_path_1.resolve)(index_1.CONFIGURATION_DEFAULT_FILE.replace('.js', '.ts'));
    if (args.get('config')) {
        configurationFile = args.get('config');
    }
    console.log('Detected configuration file', configurationFile);
    await (0, utils_1.transpileFiles)(configurationFile);
    const configuration = (await (_a = configurationFile.replace('.ts', '.js'), Promise.resolve().then(() => __importStar(require(_a))))).default;
    console.log('Using configuration', configuration);
    await (0, utils_1.transpileFiles)('', (0, node_path_1.resolve)(configuration.migrationsFolderPath));
    console.log('Migrations compiled successfully!');
}
exports.default = compile;
//# sourceMappingURL=index.js.map