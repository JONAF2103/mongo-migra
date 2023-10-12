"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const fs_1 = require("fs");
const utils_1 = require("../../utils");
async function create(configuration) {
    const args = (0, utils_1.parseArguments)(['name']);
    const migrationName = `${new Date().getTime()}-${args.get('name')}`;
    console.log(`Creating new migration called ${migrationName} ...`);
    const migrationsFolder = (0, node_path_1.resolve)(configuration.migrationsFolderPath).replace(/\s/g, '\\ ');
    if (!(0, node_fs_1.existsSync)(migrationsFolder)) {
        console.log(`Creating missing migration folder ${migrationsFolder} ...`);
        (0, fs_1.mkdirSync)(migrationsFolder, { recursive: true });
    }
    const migrationFolder = (0, node_path_1.resolve)(migrationsFolder, `${migrationName}`).replace(/\s/g, '\\ ');
    if ((0, node_fs_1.existsSync)(migrationFolder)) {
        throw Error(`Migration ${migrationName} already exists!`);
    }
    (0, fs_1.mkdirSync)(migrationFolder, { recursive: true });
    const upMigrationTemplate = (0, fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, 'migration-templates/up.template.ts').replace(/\s/g, '\\ '));
    const downMigrationTemplate = (0, fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, 'migration-templates/down.template.ts').replace(/\s/g, '\\ '));
    (0, fs_1.writeFileSync)(`${migrationFolder}/up.ts`, upMigrationTemplate);
    (0, fs_1.writeFileSync)(`${migrationFolder}/down.ts`, downMigrationTemplate);
    console.log(`Migration ${migrationName} created successfully on ${migrationFolder}`);
}
exports.default = create;
//# sourceMappingURL=index.js.map