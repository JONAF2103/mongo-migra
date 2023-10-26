import {cleanupTranspiledFiles, parseArguments} from "../../utils";
import {resolve} from "node:path";

export default async function cleanup(): Promise<void> {
  const args: Map<string, string> = parseArguments(['folders']);
  const folders = args.get('folders').split(',').map(folderPath => resolve(folderPath));
  cleanupTranspiledFiles(folders);
  console.log('Migrations cleanup successfully!');
}