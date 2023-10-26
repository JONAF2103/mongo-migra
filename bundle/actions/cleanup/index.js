"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const node_path_1 = require("node:path");
async function cleanup() {
    const args = (0, utils_1.parseArguments)(['folders']);
    const folders = args.get('folders').split(',').map(folderPath => (0, node_path_1.resolve)(folderPath));
    (0, utils_1.cleanupTranspiledFiles)(folders);
    console.log('Migrations cleanup successfully!');
}
exports.default = cleanup;
//# sourceMappingURL=index.js.map