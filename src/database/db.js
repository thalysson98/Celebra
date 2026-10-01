import * as SQLite from 'expo-sqlite';

const DATA_NAME = "mobile-app";

const SQL_CREATE = `
    create table if not exists produtos (
        id integer primary key autoincrement,
        name varchar(100) not null,
        valor real not null
    )
`;

let db = null;

export default async function OpenDB() {
    if (!db) {
        db = await SQLite.openDatabaseAsync(DATA_NAME);
        await db.withTransactionAsync(async () => {
            await db.execAsync(SQL_CREATE);
        });
    }
    return db;
}

