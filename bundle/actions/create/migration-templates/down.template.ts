import {ClientSession, Db, MongoClient} from "mongodb";

export async function down(client: MongoClient, db: Db, session?: ClientSession): Promise<void> {}