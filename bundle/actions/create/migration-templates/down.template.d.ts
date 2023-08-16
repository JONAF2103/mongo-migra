import { ClientSession, Db, MongoClient } from "mongodb";
export declare function down(client: MongoClient, db: Db, session?: ClientSession): Promise<void>;
