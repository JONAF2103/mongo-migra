import {resolve} from "node:path";
import {exec} from "child_process";
import {lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFile, writeFileSync} from "fs";

export function parseArguments(requiredParameters: string[] = [], argvIndex = 2): Map<string, string> {
  const argMap: Map<string, string> = new Map();
  process.argv.slice(argvIndex).forEach((arg) => {
    const [key, value] = arg.split('=');
    argMap.set(key, value);
  });
  for (const requiredParameter of requiredParameters) {
    if (!argMap.has(requiredParameter)) {
      throw new Error(`${requiredParameter} is required`);
    }
  }
  return argMap;
}

async function executeCommand(command: string, environment: unknown = {}): Promise<string> {
  const env = process.env;
  Object.keys(environment).forEach(varName => {
    env[varName] = environment[varName];
  });
  return new Promise((resolve, reject) => {
    exec(command, {
      env
    }, (error, stdout, stderr) => {
      if (error) {
        reject({
          error,
          stdout,
        });
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function transpileFiles(file: string, folder?: string): Promise<void> {
    try {
      if (folder) {
        await executeCommand(`tsc ${resolve(folder).replace(/\s/g, '\\ ')}/**/**.ts`);
      } else {
        await executeCommand(`tsc ${resolve(file).replace(/\s/g, '\\ ')}`);
      }
    } catch (error) {
      if (error?.code === 'MODULE_NOT_FOUND') {
        throw error;
      }
    }
}

export function cleanupTranspiledFiles(folders: string[]): void {
  const transpiledFiles: Set<string> = new Set();
  for (const transpiledFolder of folders) {
    getAllFilesMatching(transpiledFolder, '.js').forEach(value => {
      transpiledFiles.add(value);
    });
  }
  transpiledFiles.forEach(file => {
    rmSync(file);
  });
}

export function getAllFilesMatching(containerFolder: string, fileExp: string): Set<string> {
  const result: Set<string> = new Set();
  if (lstatSync(containerFolder).isDirectory()) {
    const files = readdirSync(containerFolder);
    for (const file of files) {
      if (file.endsWith(fileExp)) {
        result.add(`${containerFolder}/${file}`);
      } else if (lstatSync(`${containerFolder}/${file}`).isDirectory()) {
        getAllFilesMatching(`${containerFolder}/${file}`, fileExp).forEach(value => {
          result.add(value);
        });
      }
    }
  } else {
    if (containerFolder.endsWith(fileExp)) {
      result.add(containerFolder);
    }
  }
  return result;
}