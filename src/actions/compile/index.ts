import {resolve} from "node:path";
import {Configuration, CONFIGURATION_DEFAULT_FILE} from "../../index";
import {transpileFiles} from "../../utils";

export default async function compile(args: Map<string, string>): Promise<void> {
  let configurationFile = resolve(CONFIGURATION_DEFAULT_FILE.replace('.js', '.ts'));
  if (args.get('config')) {
    configurationFile = args.get('config');
  }
  console.log('Detected configuration file', configurationFile);
  await transpileFiles(configurationFile);
  const configuration: Configuration = (await (import(configurationFile.replace('.ts', '.js')))).default;
  console.log('Using configuration', configuration);
  await transpileFiles('', resolve(configuration.migrationsFolderPath));
  console.log('Migrations compiled successfully!');
}