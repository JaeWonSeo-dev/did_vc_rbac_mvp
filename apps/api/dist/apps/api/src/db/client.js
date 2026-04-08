import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { schemaSql } from "./schema";
export function createDb(databasePath) {
    const absolute = path.resolve(databasePath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    const db = new Database(absolute);
    db.pragma("journal_mode = WAL");
    db.exec(schemaSql);
    return db;
}
