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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const mongodb_1 = require("mongodb");
const node_crypto_1 = __importDefault(require("node:crypto"));
const types_1 = require("../../types");
const constants_1 = require("../../constants");
async function getFileChecksum(path) {
    return new Promise(function (resolve, reject) {
        const hash = node_crypto_1.default.createHash('md5');
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
async function executeUpMigration({ mongoClient, dbName, availableMigrations, changeLogCollectionName, configuration }) {
    var _a;
    const db = mongoClient.db(dbName);
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
    const migrationStats = [];
    for (const availableMigration of availableMigrations) {
        const upChecksum = await getFileChecksum((0, node_path_1.resolve)(availableMigration.location, 'up.js'));
        const downChecksum = await getFileChecksum((0, node_path_1.resolve)(availableMigration.location, 'down.js'));
        const appliedMigration = appliedMigrations.find(migration => migration.name === availableMigration.name);
        if (appliedMigration && appliedMigration.status === types_1.MigrationStatus.Applied) {
            console.log(`Skipping already applied migration ${appliedMigration.name}...`);
            const upChecksumDiff = appliedMigration.upChecksum !== upChecksum;
            const downChecksumDiff = appliedMigration.downChecksum !== downChecksum;
            migrationStats.push({
                Name: appliedMigration.name,
                "Checksum UP Different": upChecksumDiff,
                "Checksum DOWN Different": downChecksumDiff,
                UP: false,
                DOWN: false,
            });
        }
        else {
            if (appliedMigration) {
                console.log(`Re-executing failed migration ${availableMigration.name} on db ${dbName}...`);
            }
            else {
                console.log(`Executing migration ${availableMigration.name} on db ${dbName}...`);
            }
            const replicaSetEnabled = configuration.uri.indexOf('replicaSet') !== -1;
            let session = null;
            if (replicaSetEnabled) {
                session = mongoClient.startSession();
            }
            try {
                const { up, post, validate } = await (_a = (0, node_path_1.resolve)(availableMigration.location, 'up.js'), Promise.resolve().then(() => __importStar(require(_a))));
                if (replicaSetEnabled && session) {
                    await session.withTransaction(async () => {
                        await up(mongoClient, db, session);
                        if (validate) {
                            await validate(mongoClient, db, session);
                        }
                    });
                    await session.commitTransaction();
                }
                else {
                    await up(mongoClient, db);
                    if (validate) {
                        await validate(mongoClient, db);
                    }
                }
                migrationStats.push({
                    Name: availableMigration.name,
                    "Checksum UP Different": false,
                    "Checksum DOWN Different": false,
                    UP: true,
                    DOWN: false,
                });
                if (appliedMigration) {
                    await changelogCollection.updateOne({ _id: appliedMigration._id }, {
                        $set: {
                            upChecksum,
                            date: new Date().toISOString(),
                            status: types_1.MigrationStatus.Applied,
                        },
                        $unset: {
                            errorMessage: 1,
                        }
                    });
                    if (post) {
                        await post(mongoClient, db);
                    }
                }
                else {
                    await changelogCollection.insertOne({
                        _id: null,
                        name: availableMigration.name,
                        upChecksum,
                        downChecksum,
                        date: new Date().toISOString(),
                        status: types_1.MigrationStatus.Applied,
                    });
                }
            }
            catch (error) {
                if (appliedMigration) {
                    await changelogCollection.updateOne({ _id: appliedMigration._id }, {
                        $set: {
                            upChecksum,
                            downChecksum,
                            date: new Date().toISOString(),
                            status: types_1.MigrationStatus.ErrorUp,
                            errorMessage: error.message,
                        }
                    });
                }
                else {
                    await changelogCollection.insertOne({
                        _id: null,
                        name: availableMigration.name,
                        upChecksum,
                        downChecksum,
                        date: new Date().toISOString(),
                        status: types_1.MigrationStatus.ErrorUp,
                        errorMessage: error.message,
                    });
                }
                throw error;
            }
            finally {
                if (replicaSetEnabled && session) {
                    await session.endSession();
                }
            }
        }
    }
    console.log('Migrations Up Result:');
    console.table(migrationStats);
}
async function up(configuration) {
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
            location: `${migrationsFolder}/${name}`.replace(/\s/g, '\\ ')
        };
    });
    console.log('Checking available migrations:');
    console.table(migrationsTable);
    const mongoClient = await new mongodb_1.MongoClient(configuration.uri).connect();
    if (configuration.dbName) {
        console.log(`Migrating up db ${configuration.dbName} on ${configuration.uri}...`);
        await executeUpMigration({
            mongoClient,
            dbName: configuration.dbName,
            changeLogCollectionName: configuration.changeLogCollectionName,
            availableMigrations,
            configuration,
        });
    }
    else {
        console.log(`Migrating up all dbs on ${configuration.uri}...`);
        const dbs = await mongoClient.db().admin().listDatabases();
        for (const db of dbs.databases) {
            if (constants_1.ADMIN_DBS.some(name => db.name === name) && !configuration.includeAdminDbs) {
                continue;
            }
            await executeUpMigration({
                mongoClient,
                dbName: db.name,
                changeLogCollectionName: configuration.changeLogCollectionName,
                availableMigrations,
                configuration,
            });
        }
    }
    await mongoClient.close(true);
}
exports.default = up;
//# sourceMappingURL=index.js.map