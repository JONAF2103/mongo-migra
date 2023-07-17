import {resolve} from 'node:path';
import {existsSync} from "node:fs";

import {parseArguments} from "./utils";
import {DEFAULT_CONFIG} from "./configuration";
import {Configuration} from "./types";
import {showHelp} from "./help";
async function execute(args: Map<string, string>): Promise<void> {
  const actionName = args.get('action');
  try {
    const configFilePath = args.has('config') ? resolve(args.get('config')) : './configuration.ts';
    const configFile = resolve(configFilePath);
    let configuration: Configuration;
    if (existsSync(configFile)) {
      console.log(`Using configuration file ${configFile}`);
      configuration = (await import(configFile)).default;
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