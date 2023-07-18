import {resolve} from "node:path";
import {readFileSync, writeFileSync} from "fs";

export default async function init(): Promise<void> {
  console.log('Initializing mongo-migra configuration file...');
  const defaultConfigFile = readFileSync(resolve(__dirname, '../../../configuration.ts'), 'utf-8');
  writeFileSync(resolve('./configuration.ts'), defaultConfigFile);
  console.log('Initialization done!');
}