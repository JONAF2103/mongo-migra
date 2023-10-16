import { ClientSession, Db, MongoClient } from "mongodb";
export declare function down(client: MongoClient, db: Db, session?: ClientSession): Promise<void>;
export declare function validate(client: MongoClient, db: Db, session?: ClientSession): Promise<void>;
export declare function post(client: MongoClient, db: Db): Promise<void>;
