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
exports.transpileInMemory = exports.parseArguments = void 0;
const node_path_1 = require("node:path");
const child_process_1 = require("child_process");
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
async function executeCommand(command, environment = {}) {
    const env = process.env;
    Object.keys(environment).forEach(varName => {
        env[varName] = environment[varName];
    });
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, {
            env
        }, (error, stdout, stderr) => {
            if (error) {
                reject({
                    error,
                    stdout,
                });
            }
            else if (stderr) {
                reject(stderr);
            }
            else {
                resolve(stdout);
            }
        });
    });
}
async function transpileInMemory(file, folder) {
    try {
        if (folder) {
            await executeCommand(`tsc ${(0, node_path_1.resolve)(folder).replace(/\s/g, '\\ ')}/**/**.ts`);
        }
        else {
            await executeCommand(`tsc ${(0, node_path_1.resolve)(file).replace(/\s/g, '\\ ')}`);
        }
    }
    catch (ignored) { }
    let transpiledFile = file.replace('.ts', '.js');
    const result = await (_a = transpiledFile, Promise.resolve().then(() => __importStar(require(_a))));
    cleanupTranspiledFiles(file, folder);
    return result;
}
exports.transpileInMemory = transpileInMemory;
function cleanupTranspiledFiles(file, folder) {
    const transpiledFiles = new Set();
    transpiledFiles.add(file.replace('.ts', '.js'));
    if (folder) {
        getAllFilesMatching(folder, '.js').forEach(value => {
            transpiledFiles.add(value);
        });
    }
    transpiledFiles.forEach(file => {
        (0, fs_1.rmSync)(file);
    });
}
function getAllFilesMatching(containerFolder, fileExp) {
    const result = new Set();
    if ((0, fs_1.lstatSync)(containerFolder).isDirectory()) {
        const files = (0, fs_1.readdirSync)(containerFolder);
        for (const file of files) {
            if (file.endsWith(fileExp)) {
                result.add(`${containerFolder}/${file}`);
            }
            else if ((0, fs_1.lstatSync)(`${containerFolder}/${file}`).isDirectory()) {
                getAllFilesMatching(`${containerFolder}/${file}`, fileExp).forEach(value => {
                    result.add(value);
                });
            }
        }
    }
    else {
        if (containerFolder.endsWith(fileExp)) {
            result.add(containerFolder);
        }
    }
    return result;
}
//# sourceMappingURL=utils.js.map