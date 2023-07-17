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