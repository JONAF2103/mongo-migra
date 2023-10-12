import {resolve} from "node:path";
import {readFileSync, writeFileSync} from "fs";

export default async function init(): Promise<void> {
  console.log('Initializing mongo-migra configuration file...');
  const defaultConfigFile = readFileSync(resolve(__dirname, '../../../mongo-migra.ts').replace(/\s/g, '\\ '), 'utf-8');
  writeFileSync(resolve('./mongo-migra.ts').replace(/\s/g, '\\ '), defaultConfigFile);
  console.log('Initialization done!');
}