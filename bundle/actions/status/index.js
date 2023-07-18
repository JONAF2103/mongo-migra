"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
async function status(configuration) {
    const mongoClient = await new mongodb_1.MongoClient(configuration.uri).connect();
    let appliedMigrations = [];
    if (configuration.dbName) {
        const migrations = mongoClient.db(configuration.dbName).collection(configuration.changeLogCollectionName).find();
        for await (const migration of migrations) {
            appliedMigrations.push(migration);
        }
    }
    else {
        const dbs = await mongoClient.db().admin().listDatabases();
        for (const db of dbs.databases) {
            const migrations = mongoClient.db(db.name).collection(configuration.changeLogCollectionName).find();
            for await (const migration of migrations) {
                appliedMigrations.push(migration);
            }
        }
    }
    if (appliedMigrations.length > 0) {
        console.table(appliedMigrations);
    }
    else {
        console.log('No migrations found!');
    }
    await mongoClient.close(true);
}
exports.default = status;
//# sourceMappingURL=index.js.map