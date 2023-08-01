"use strict";
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
const utils_1 = require("../../utils");
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
            const migration = (0, utils_1.transpileInMemory)((0, node_path_1.resolve)(availableMigration.location, 'down.ts'));
            const replicaSetEnabled = configuration.uri.indexOf('replicaSet') !== -1;
            let session = null;
            if (replicaSetEnabled) {
                session = await mongoClient.startSession();
            }
            try {
                if (replicaSetEnabled && session) {
                    await session.withTransaction(async () => {
                        await migration(mongoClient, session);
                    });
                    await session.commitTransaction();
                }
                else {
                    await migration(mongoClient);
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
    const migrationsAvailable = (0, fs_1.readdirSync)(migrationsFolder);
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