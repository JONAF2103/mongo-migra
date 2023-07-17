import {createReadStream, readdirSync, readFileSync} from "fs";
import {resolve} from "node:path";
import {existsSync} from "node:fs";
import {ClientSession, MongoClient} from "mongodb";
import crypto from 'node:crypto';
import {transpile} from 'typescript';

import {AvailableMigration, Configuration, Migration, MigrationStats, MigrationStatus} from "../../types";
import {parseArguments} from "../../utils";

interface DownMigrationProps {
  mongoClient: MongoClient;
  dbName: string;
  changeLogCollectionName: string;
  availableMigrations: AvailableMigration[];
  numberOfMigrations: number;
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

async function executeDownMigration({mongoClient, dbName, availableMigrations, changeLogCollectionName, numberOfMigrations, configuration}: DownMigrationProps): Promise<void> {
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
  } else {
    console.log(`No migrations found on database ${dbName}`);
    return;
  }
  const migrationStats: MigrationStats[] = [];
  let migrationsDownAmount = 0;
  for (const appliedMigration of appliedMigrations.sort((a, b) => {
    if (b.date > a.date) {
      return 1;
    } else if (b.date < a.date) {
      return -1;
    }
    return 0;
  })) {
    if (migrationsDownAmount < numberOfMigrations) {
      console.log(`Down migration ${appliedMigration.name}...`);
      const availableMigration = availableMigrations.find(migration => migration.name === appliedMigration.name);
      const downChecksum = await getFileChecksum(resolve(availableMigration.location, 'down.ts'));
      const downChecksumDiff = downChecksum !== appliedMigration.downChecksum;
      const transpiledMigration = transpile(readFileSync(resolve(availableMigration.location, 'down.ts'), 'utf-8'), {esModuleInterop: true});
      const migration = eval(transpiledMigration);
      const replicaSetEnabled = configuration.uri.indexOf('replicaSet') !== -1;
      let session: ClientSession = null;
      if (replicaSetEnabled) {
        session = await mongoClient.startSession();
      }
      try {
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
          "Checksum DOWN Different": downChecksumDiff,
          UP: false,
          DOWN: true,
        });
        await changelogCollection.deleteOne({
          _id: appliedMigration._id,
        });
      } catch (error) {
        await changelogCollection.updateOne({_id: appliedMigration._id}, {
          $set: {
            downChecksum,
            date: new Date().toISOString(),
            status: MigrationStatus.ErrorDown,
            errorMessage: error.message,
          }
        });
      } finally {
        if (replicaSetEnabled && session) {
          await session.endSession();
        }
      }
    } else {
      break;
    }
    migrationsDownAmount++;
  }
  console.log('Migrations Down Result:')
  console.table(migrationStats);
}

export default async function down(configuration: Configuration): Promise<void> {
  const args = parseArguments();
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
    console.log(`Migrating down db ${configuration.dbName} on ${configuration.uri}...`);
    await executeDownMigration({
      mongoClient,
      dbName: configuration.dbName,
      changeLogCollectionName: configuration.changeLogCollectionName,
      availableMigrations,
      numberOfMigrations: args.has('amoount') ? parseInt(args.get('amount')) : 1,
      configuration,
    });
  } else {
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