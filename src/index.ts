import {resolve} from 'node:path';
import {existsSync} from "node:fs";

import {parseArguments} from "./utils";
import {DEFAULT_CONFIG} from "./configuration";
import {Configuration} from "./types";
import {showHelp} from "./help";

export const CONFIGURATION_DEFAULT_FILE = 'mongo-migra.js';

export * from './types';

function mergeEnvConfiguration(configuration: Configuration): Configuration {
  if (!configuration.env) {
    return configuration;
  }
  for (const parameter of Object.keys(configuration.env)) {
    const envVarName = configuration.env[parameter];
    const value = process.env[envVarName];
    if (value) {
      configuration[parameter] = value;
    }
  }
  return configuration;
}

function muteConsole() {
  Object.keys(console).forEach(key => {
    console[key] = function() {};
  });
}

async function execute(args: Map<string, string>): Promise<void> {
  const actionName = args.get('action');

  if (actionName === 'compile' || actionName === 'cleanup') {
    return await (await import((`./actions/${actionName}`))).default(args);
  }

  const verbose = args.has('verbose');
  const silent = args.has('silent');
  if (silent && actionName !== 'status') {
    console.log('Executing on silent mode...');
    muteConsole();
  }
  let configFilePath: string;
  if (args.has('config')) {
    if (!existsSync(resolve(args.get('config')))) {
      throw new Error(`${resolve(args.get('config'))} doesn't exists`);
    }
  } else if (existsSync(resolve(CONFIGURATION_DEFAULT_FILE))) {
    configFilePath = resolve(CONFIGURATION_DEFAULT_FILE);
  }
  let configuration: Configuration;
  if (existsSync(configFilePath)) {
    const configFile = resolve(configFilePath);
    if (verbose) {
      console.log(`Using configuration file ${configFile}`);
    }
    configuration = (await import(configFile.replace(/\s/g, '\\ '))).default;
  } else {
    if (verbose) {
      console.log('Using default configuration...');
    }
    configuration = DEFAULT_CONFIG;
  }
  configuration = mergeEnvConfiguration(configuration);
  if (verbose) {
    console.log('Configuration value', configuration);
  }
  await (await import((`./actions/${actionName}`))).default(configuration);
}

if (process.argv.slice(2)[0] === '--help' || process.argv.slice(2)[0] === '-h') {
  showHelp();
} else {
  execute(parseArguments(['action'])).catch(error => {
    console.error(error);
    process.exit(1);
  });
}