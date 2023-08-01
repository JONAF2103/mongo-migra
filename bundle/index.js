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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const utils_1 = require("./utils");
const configuration_1 = require("./configuration");
const help_1 = require("./help");
const configurationFileName = 'mongo-migra.ts';
__exportStar(require("./types"), exports);
function mergeEnvConfiguration(configuration) {
    if (!configuration.env) {
        return configuration;
    }
    for (const parameter of Object.keys(configuration.env)) {
        const envVarName = configuration.env[parameter];
        const value = process.env[envVarName];
        if (value) {
            configuration[parameter] = value;
        }
    }
    return configuration;
}
async function execute(args) {
    var _a;
    const actionName = args.get('action');
    const verbose = args.has('verbose');
    let configFilePath;
    if (args.has('config')) {
        if (!(0, node_fs_1.existsSync)((0, node_path_1.resolve)(args.get('config')))) {
            throw new Error(`${(0, node_path_1.resolve)(args.get('config'))} doesn't exists`);
        }
    }
    else if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(configurationFileName))) {
        configFilePath = (0, node_path_1.resolve)(configurationFileName);
    }
    try {
        let configuration;
        if ((0, node_fs_1.existsSync)(configFilePath)) {
            const configFile = (0, node_path_1.resolve)(configFilePath);
            if (verbose) {
                console.log(`Using configuration file ${configFile}`);
            }
            configuration = (0, utils_1.transpileInMemory)(configFile);
        }
        else {
            if (verbose) {
                console.log('Using default configuration...');
            }
            configuration = configuration_1.DEFAULT_CONFIG;
        }
        configuration = mergeEnvConfiguration(configuration);
        if (verbose) {
            console.log('Configuration value', configuration);
        }
        await (await (_a = (`./actions/${actionName}`), Promise.resolve().then(() => __importStar(require(_a))))).default(configuration);
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            throw new Error(`Invalid action name ${actionName}`);
        }
        throw error;
    }
}
if (process.argv.slice(2)[0] === '--help' || process.argv.slice(2)[0] === '-h') {
    (0, help_1.showHelp)();
}
else {
    execute((0, utils_1.parseArguments)(['action'])).catch(error => {
        console.error(error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map