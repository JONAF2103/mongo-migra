import {createReadStream, readdirSync, readFileSync} from "fs";
import {resolve} from "node:path";
import {existsSync} from "node:fs";
import {ClientSession, MongoClient} from "mongodb";
import crypto from 'node:crypto';
import {transpile} from 'typescript';

import {AvailableMigration, Configuration, Migration, MigrationStats, MigrationStatus} from "../../types";

interface UpMigrationProps {
  mongoClient: MongoClient;
  dbName: string;
  changeLogCollectionName: string;
  availableMigrations: AvailableMigration[];
  configuration: Configuration;
}

async function getFileChecksum(path: string): Promise<string> {
  return new Promise<string>(function (resolve, reject) {
    const hash = crypto.createHash('md5');
    const input = createReadStream(path);
    input.on('error', reject);
    input.on('data', function (chunk) {
      hash.update(chunk);
    });
    input.on('close', function () {
      resolve(hash.digest('hex'));
    });
  });
}

async function executeUpMigration({mongoClient, dbName, availableMigrations, changeLogCollectionName, configuration}: UpMigrationProps): Promise<void> {
  const db = await mongoClient.db(dbName);
  const changelogCollection = db.collection<Migration>(changeLogCollectionName);
  const migrationsOnDatabase = changelogCollection.find();
  const appliedMigrations: Migration[] = [];
  for await (const migrationOnDatabase of migrationsOnDatabase) {
    appliedMigrations.push(migrationOnDatabase);
  }
  if (appliedMigrations.length > 0) {
    console.log('Migrations on database:')
    console.table(appliedMigrations);
  }
  const migrationStats: MigrationStats[] = [];
  for (const availableMigration of availableMigrations) {
    const upChecksum = await getFileChecksum(resolve(availableMigration.location, 'up.ts'));
    const downChecksum = await getFileChecksum(resolve(availableMigration.location, 'down.ts'));
    const appliedMigration = appliedMigrations.find(migration => migration.name === availableMigration.name);
    if (appliedMigration && appliedMigration.status === MigrationStatus.Applied) {
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
    } else {
      console.log(`Executing migration ${availableMigration.name} on db ${dbName}...`);
      const replicaSetEnabled = configuration.uri.indexOf('replicaSet') !== -1;
      let session: ClientSession = null;
      if (replicaSetEnabled) {
        session = await mongoClient.startSession();
      }
      try {
        const transpiledMigration = transpile(readFileSync(resolve(availableMigration.location, 'up.ts'), 'utf-8'), {esModuleInterop: true});
        const migration = eval(transpiledMigration);
        if (replicaSetEnabled && session) {
          await session.withTransaction(async () => {
            await migration(mongoClient, session);
          });
          await session.commitTransaction();
        } else {
          await migration(mongoClient);
        }
        migrationStats.push({
          Name: availableMigration.name,
          "Checksum UP Different": false,
          "Checksum DOWN Different": false,
          UP: true,
          DOWN: false,
        });
        if (appliedMigration) {
          await changelogCollection.updateOne({_id: appliedMigration._id}, {
            $set: {
              upChecksum,
              date: new Date().toISOString(),
              status: MigrationStatus.Applied,
            }
          });
        } else {
          await changelogCollection.insertOne({
            _id: null,
            name: availableMigration.name,
            upChecksum,
            downChecksum,
            date: new Date().toISOString(),
            status: MigrationStatus.Applied,
          });
        }
      } catch (error) {
        if (appliedMigration) {
          await changelogCollection.updateOne({_id: appliedMigration._id}, {
            $set: {
              upChecksum,
              downChecksum,
              date: new Date().toISOString(),
              status: MigrationStatus.ErrorUp,
              errorMessage: error.message,
            }
          });
        } else {
          await changelogCollection.insertOne({
            _id: null,
            name: availableMigration.name,
            upChecksum,
            downChecksum,
            date: new Date().toISOString(),
            status: MigrationStatus.ErrorUp,
            errorMessage: error.message,
          });
        }
        throw error;
      } finally {
        if (replicaSetEnabled && session) {
          await session.endSession();
        }
      }
    }
  }
  console.log('Migrations Up Result:')
  console.table(migrationStats);
}

export default async function up(configuration: Configuration): Promise<void> {
  const migrationsFolder = resolve(configuration.migrationsFolderPath);
  if (!existsSync(migrationsFolder)) {
    throw new Error(`${configuration.migrationsFolderPath} doesn't exists`);
  }
  const migrationsAvailable = readdirSync(migrationsFolder);
  const migrationsTable = migrationsAvailable.map(migrationName => {
    return {
      [`Migration Name`]: migrationName,
      Location: `${migrationsFolder}/${migrationName}`,
    };
  });
  const availableMigrations: AvailableMigration[] = migrationsAvailable.map(name => {
    return {
      name,
      location: `${migrationsFolder}/${name}`
    };
  });
  console.log('Checking available migrations:');
  console.table(migrationsTable);
  const mongoClient = await new MongoClient(configuration.uri).connect();
  if (configuration.dbName) {
    console.log(`Migrating up db ${configuration.dbName} on ${configuration.uri}...`);
    await executeUpMigration({
      mongoClient,
      dbName: configuration.dbName,
      changeLogCollectionName: configuration.changeLogCollectionName,
      availableMigrations,
      configuration,
    });
  } else {
    console.log(`Migrating up all dbs on ${configuration.uri}...`);
    const dbs = await mongoClient.db().admin().listDatabases();
    for (const db of dbs.databases) {
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