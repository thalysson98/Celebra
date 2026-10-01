import * as SQLite from 'expo-sqlite';

const DB_NAME = "locations.db";

const SQL_CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );
`;

let db = null;

export async function openLocationDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.withTransactionAsync(async () => {
      await db.execAsync(SQL_CREATE_TABLE);
    });
  }
  return db;
}

export async function insertLocation(latitude, longitude) {
  const database = await openLocationDb();
  const result = await database.runAsync(
    'INSERT INTO locations (latitude, longitude) VALUES (?, ?)',
    [latitude, longitude]
  );
  return result;
}

export async function getLocations() {
  const database = await openLocationDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM locations ORDER BY id DESC'
  );
  return rows;
}

