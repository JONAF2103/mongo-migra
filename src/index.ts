import {resolve} from 'node:path';
import {existsSync} from "node:fs";

import {parseArguments} from "./utils";
import {DEFAULT_CONFIG} from "./configuration";
import {Configuration} from "./types";
import {showHelp} from "./help";
import {transpile} from "typescript";
import {readFileSync} from "fs";

const configurationFileName = 'mongo-migra.ts';

export * from './types';

async function execute(args: Map<string, string>): Promise<void> {
  const actionName = args.get('action');
  let configFilePath;
  if (args.has('config')) {
    if (!existsSync(resolve(args.get('config')))) {
      throw new Error(`${resolve(args.get('config'))} doesn't exists`);
    }
  } else if (existsSync(resolve(configurationFileName))) {
    configFilePath = resolve(configurationFileName);
  }
  try {
    let configuration: Configuration;
    if (existsSync(configFilePath)) {
      const configFile = resolve(configFilePath);
      console.log(`Using configuration file ${configFile}`);
      const configFileContent = transpile(readFileSync(configFile, 'utf-8'), {esModuleInterop: true});
      configuration = eval(configFileContent);
      console.log('Config', configuration);
    } else {
      console.log('Using default configuration...');
      configuration = DEFAULT_CONFIG;
    }
    await (await import((`./actions/${actionName}`))).default(configuration);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(`Invalid action name ${actionName}`);
    }
    throw error;
  }
}

if (process.argv.slice(2)[0] === '--help' || process.argv.slice(2)[0] === '-h') {
  showHelp();
} else {
  execute(parseArguments(['action'])).catch(error => {
    console.error(error);
    process.exit(1);
  });
}