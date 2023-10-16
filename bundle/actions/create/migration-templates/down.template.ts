import {ClientSession, Db, MongoClient} from "mongodb";

export async function down(client: MongoClient, db: Db, session?: ClientSession): Promise<void> {}

export async function validate(client: MongoClient, db: Db, session?: ClientSession): Promise<void> {}
export async function post(client: MongoClient, db: Db): Promise<void> {}