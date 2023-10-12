"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const fs_1 = require("fs");
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
async function deleteMigration(configuration) {
    const args = (0, utils_1.parseArguments)(['name']);
    const name = args.get('name');
    console.log(`Deleting migration folder ${configuration.migrationsFolderPath}/${name}...`);
    if ((0, node_fs_1.existsSync)((0, node_path_1.resolve)(configuration.migrationsFolderPath, name).replace(/\s/g, '\\ '))) {
        (0, fs_1.rmSync)((0, node_path_1.resolve)(configuration.migrationsFolderPath, name).replace(/\s/g, '\\ '), { recursive: true });
        console.log(`Migration ${name} deleted successfully!`);
    }
    else {
        throw new Error(`Migration ${name} doesn't exists`);
    }
}
exports.default = deleteMigration;
//# sourceMappingURL=index.js.map