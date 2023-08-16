import { ClientSession, Db, MongoClient } from "mongodb";
export declare function up(client: MongoClient, db: Db, session?: ClientSession): Promise<void>;
