"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFilesMatching = exports.cleanupTranspiledFiles = exports.transpileFiles = exports.parseArguments = void 0;
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
async function transpileFiles(file, folder) {
    try {
        if (folder) {
            await executeCommand(`tsc ${(0, node_path_1.resolve)(folder).replace(/\s/g, '\\ ')}/**/**.ts`);
        }
        else {
            await executeCommand(`tsc ${(0, node_path_1.resolve)(file).replace(/\s/g, '\\ ')}`);
        }
    }
    catch (error) {
        if (error?.code === 'MODULE_NOT_FOUND') {
            throw error;
        }
    }
}
exports.transpileFiles = transpileFiles;
function cleanupTranspiledFiles(folders) {
    const transpiledFiles = new Set();
    for (const transpiledFolder of folders) {
        getAllFilesMatching(transpiledFolder, '.js').forEach(value => {
            transpiledFiles.add(value);
        });
    }
    transpiledFiles.forEach(file => {
        (0, fs_1.rmSync)(file);
    });
}
exports.cleanupTranspiledFiles = cleanupTranspiledFiles;
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
exports.getAllFilesMatching = getAllFilesMatching;
//# sourceMappingURL=utils.js.map