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
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const mongodb_1 = require("mongodb");
const crypto = __importStar(require("node:crypto"));
const types_1 = require("../../types");
const utils_1 = require("../../utils");
const constants_1 = require("../../constants");
async function getFileChecksum(path) {
    return new Promise(function (resolve, reject) {
        const hash = crypto.createHash('md5');
        const input = (0, fs_1.createReadStream)(path);
        input.on('error', reject);
        input.on('data', function (chunk) {
            hash.update(chunk);
        });
        input.on('close', function () {
            resolve(hash.digest('hex'));
        });
    });
}
async function executeDownMigration({ mongoClient, dbName, availableMigrations, changeLogCollectionName, numberOfMigrations, configuration }) {
    const db = await mongoClient.db(dbName);
    const changelogCollection = db.collection(changeLogCollectionName);
    const migrationsOnDatabase = changelogCollection.find();
    const appliedMigrations = [];
    for await (const migrationOnDatabase of migrationsOnDatabase) {
        appliedMigrations.push(migrationOnDatabase);
    }
    if (appliedMigrations.length > 0) {
        console.log('Migrations on database:');
        console.table(appliedMigrations);
    }
    else {
        console.log(`No migrations found on database ${dbName}`);
        return;
    }
    const migrationStats = [];
    let migrationsDownAmount = 0;
    for (const appliedMigration of appliedMigrations.sort((a, b) => {
        if (b.date > a.date) {
            return 1;
        }
        else if (b.date < a.date) {
            return -1;
        }
        return 0;
    })) {
        if (migrationsDownAmount < numberOfMigrations) {
            console.log(`Down migration ${appliedMigration.name}...`);
            const availableMigration = availableMigrations.find(migration => migration.name === appliedMigration.name);
            const downChecksum = await getFileChecksum((0, node_path_1.resolve)(availableMigration.location, 'down.ts'));
            const downChecksumDiff = downChecksum !== appliedMigration.downChecksum;
            const { down } = await (0, utils_1.transpileInMemory)((0, node_path_1.resolve)(availableMigration.location, 'down.ts'), (0, node_path_1.resolve)(configuration.migrationsFolderPath));
            const replicaSetEnabled = configuration.uri.indexOf('replicaSet') !== -1;
            let session = null;
            if (replicaSetEnabled) {
                session = mongoClient.startSession();
            }
            try {
                if (replicaSetEnabled && session) {
                    await session.withTransaction(async () => {
                        await down(mongoClient, db, session);
                    });
                    await session.commitTransaction();
                }
                else {
                    await down(mongoClient, db);
                }
                migrationStats.push({
                    Name: availableMigration.name,
                    "Checksum DOWN Different": downChecksumDiff,
                    UP: false,
                    DOWN: true,
                });
                await changelogCollection.deleteOne({
                    _id: appliedMigration._id,
                });
            }
            catch (error) {
                await changelogCollection.updateOne({ _id: appliedMigration._id }, {
                    $set: {
                        downChecksum,
                        date: new Date().toISOString(),
                        status: types_1.MigrationStatus.ErrorDown,
                        errorMessage: error.message,
                    }
                });
            }
            finally {
                if (replicaSetEnabled && session) {
                    await session.endSession();
                }
            }
        }
        else {
            break;
        }
        migrationsDownAmount++;
    }
    console.log('Migrations Down Result:');
    console.table(migrationStats);
}
async function down(configuration) {
    const args = (0, utils_1.parseArguments)();
    const migrationsFolder = (0, node_path_1.resolve)(configuration.migrationsFolderPath);
    if (!(0, node_fs_1.existsSync)(migrationsFolder)) {
        throw new Error(`${configuration.migrationsFolderPath} doesn't exists`);
    }
    const migrationsAvailable = (0, fs_1.readdirSync)(migrationsFolder).filter(file => (0, fs_1.lstatSync)(`${migrationsFolder}/${file}`).isDirectory());
    const migrationsTable = migrationsAvailable.map(migrationName => {
        return {
            [`Migration Name`]: migrationName,
            Location: `${migrationsFolder}/${migrationName}`,
        };
    });
    const availableMigrations = migrationsAvailable.map(name => {
        return {
            name,
            location: `${migrationsFolder}/${name}`
        };
    });
    console.log('Checking available migrations:');
    console.table(migrationsTable);
    const mongoClient = await new mongodb_1.MongoClient(configuration.uri).connect();
    if (configuration.dbName) {
        console.log(`Migrating down db ${configuration.dbName} on ${configuration.uri}...`);
        await executeDownMigration({
            mongoClient,
            dbName: configuration.dbName,
            changeLogCollectionName: configuration.changeLogCollectionName,
            availableMigrations,
            numberOfMigrations: args.has('amoount') ? parseInt(args.get('amount')) : 1,
            configuration,
        });
    }
    else {
        console.log(`Migrating down all dbs on ${configuration.uri}...`);
        const dbs = await mongoClient.db().admin().listDatabases();
        for (const db of dbs.databases) {
            if (constants_1.ADMIN_DBS.some(name => db.name === name) && !configuration.includeAdminDbs) {
                continue;
            }
            await executeDownMigration({
                mongoClient,
                dbName: db.name,
                changeLogCollectionName: configuration.changeLogCollectionName,
                availableMigrations,
                numberOfMigrations: args.has('amoount') ? parseInt(args.get('amount')) : 1,
                configuration,
            });
        }
    }
    await mongoClient.close(true);
}
exports.default = down;
//# sourceMappingURL=index.js.map