import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "path";

const dbPath = join(import.meta.dir, "../../data/ngaji.db");
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath, { create: true });

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA wal_autocheckpoint = 100");
