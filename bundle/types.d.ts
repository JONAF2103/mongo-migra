export declare enum MigrationStatus {
    Applied = "Applied",
    ErrorUp = "Error Up",
    ErrorDown = "Error Down"
}
export interface Migration {
    _id: string;
    name: string;
    date: string;
    upChecksum?: string;
    downChecksum?: string;
    status: MigrationStatus;
    errorMessage?: string;
}
export interface Configuration {
    uri: string;
    dbName?: string;
    changeLogCollectionName: string;
    migrationsFolderPath: string;
}
export interface AvailableMigration {
    name: string;
    location: string;
}
export interface MigrationStats {
    ['Name']: string;
    ['Checksum UP Different']?: boolean;
    ['Checksum DOWN Different']?: boolean;
    ['UP']?: boolean;
    ['DOWN']?: boolean;
}
