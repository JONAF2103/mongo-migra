import {resolve} from "node:path";
import {existsSync} from "node:fs";
import {mkdirSync, readFileSync, writeFileSync} from "fs";

import {Configuration} from "../../types";
import {parseArguments} from "../../utils";

export default async function create(configuration: Configuration): Promise<void> {
  const args: Map<string, string> = parseArguments(['name']);
  const migrationName = `${new Date().getTime()}-${args.get('name')}`;
  console.log(`Creating new migration called ${migrationName} ...`);
  const migrationsFolder = resolve(configuration.migrationsFolderPath).replace(/\s/g, '\\ ');
  if (!existsSync(migrationsFolder)) {
    console.log(`Creating missing migration folder ${migrationsFolder} ...`)
    mkdirSync(migrationsFolder, {recursive: true});
  }
  const migrationFolder = resolve(migrationsFolder, `${migrationName}`).replace(/\s/g, '\\ ');
  if (existsSync(migrationFolder)) {
    throw Error(`Migration ${migrationName} already exists!`);
  }
  mkdirSync(migrationFolder, {recursive: true});
  const upMigrationTemplate = readFileSync(resolve(__dirname, 'migration-templates/up.template.ts').replace(/\s/g, '\\ '));
  const downMigrationTemplate = readFileSync(resolve(__dirname, 'migration-templates/down.template.ts').replace(/\s/g, '\\ '));
  writeFileSync(`${migrationFolder}/up.ts`, upMigrationTemplate);
  writeFileSync(`${migrationFolder}/down.ts`, downMigrationTemplate);
  console.log(`Migration ${migrationName} created successfully on ${migrationFolder}`);
}