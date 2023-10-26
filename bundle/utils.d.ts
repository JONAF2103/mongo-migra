export declare function parseArguments(requiredParameters?: string[], argvIndex?: number): Map<string, string>;
export declare function transpileFiles(file: string, folder?: string): Promise<void>;
export declare function cleanupTranspiledFiles(folders: string[]): void;
export declare function getAllFilesMatching(containerFolder: string, fileExp: string): Set<string>;
