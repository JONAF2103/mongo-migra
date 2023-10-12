import {parseArguments} from "../../utils";
import {Configuration} from "../../types";
import {rmSync} from "fs";
import {resolve} from "node:path";
import {existsSync} from "node:fs";

export default async function deleteMigration(configuration: Configuration): Promise<void> {
  const args = parseArguments(['name']);
  const name = args.get('name');
  console.log(`Deleting migration folder ${configuration.migrationsFolderPath}/${name}...`);
  if (existsSync(resolve(configuration.migrationsFolderPath, name).replace(/\s/g, '\\ '))) {
    rmSync(resolve(configuration.migrationsFolderPath, name).replace(/\s/g, '\\ '), {recursive: true});
    console.log(`Migration ${name} deleted successfully!`);
  } else {
    throw new Error(`Migration ${name} doesn't exists`);
  }
}