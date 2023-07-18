import { ClientSession, MongoClient } from "mongodb";
export declare function down(client: MongoClient, session?: ClientSession): Promise<void>;
