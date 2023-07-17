import {MongoClient} from "mongodb";
import {Configuration, Migration} from "../../types";

export default async function status(configuration: Configuration): Promise<void> {
  const mongoClient = await new MongoClient(configuration.uri).connect();
  let appliedMigrations: Migration[] = [];
  if (configuration.dbName) {
    const migrations = mongoClient.db(configuration.dbName).collection<Migration>(configuration.changeLogCollectionName).find();
    for await (const migration of migrations) {
      appliedMigrations.push(migration);
    }
  } else {
    const dbs = await mongoClient.db().admin().listDatabases();
    for (const db of dbs.databases) {
      const migrations = mongoClient.db(db.name).collection<Migration>(configuration.changeLogCollectionName).find();
      for await (const migration of migrations) {
        appliedMigrations.push(migration);
      }
    }
  }
  if (appliedMigrations.length > 0) {
    console.table(appliedMigrations);
  } else {
    console.log('No migrations found!');
  }
  await mongoClient.close(true);
}