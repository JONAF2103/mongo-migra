"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const fs_1 = require("fs");
async function init() {
    console.log('Initializing mongo-migra configuration file...');
    const defaultConfigFile = (0, fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, '../../../configuration.ts'), 'utf-8');
    (0, fs_1.writeFileSync)((0, node_path_1.resolve)('./configuration.ts'), defaultConfigFile);
    console.log('Initialization done!');
}
exports.default = init;
//# sourceMappingURL=index.js.map