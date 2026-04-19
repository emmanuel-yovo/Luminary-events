import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'sqlite:./database.db';

let db;

// Singleton database instance
export const initDB = () => {
    if (db) return db;

    if (DATABASE_URL.startsWith('postgresql://')) {
        const { Pool } = pg;
        db = new Pool({ connectionString: DATABASE_URL });
    } else {
        db = new sqlite3.Database(DATABASE_URL.replace('sqlite:', ''));
    }

    return db;
};

export const getDB = () => {
    if (!db) {
        return initDB();
    }
    return db;
};
