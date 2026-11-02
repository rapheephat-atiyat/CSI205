import "server-only";
import "reflect-metadata";

import { DataSource } from "typeorm";
import { createDatabaseOptions } from "./database.options";

export function createDatabaseSource(databaseUrl: string): DataSource {
    return new DataSource(createDatabaseOptions(databaseUrl));
}

const globalForDatabase = globalThis as typeof globalThis & {
    __tuatuaDatabase?: Promise<DataSource>;
};

export function getDatabase(): Promise<DataSource> {
    if (!globalForDatabase.__tuatuaDatabase) {
        const databaseUrl = process.env.DATABASE;
        if (!databaseUrl?.trim()) {
            return Promise.reject(new Error("DATABASE is not configured."));
        }
        const pending = createDatabaseSource(databaseUrl)
            .initialize()
            .catch((error: unknown) => {
                if (globalForDatabase.__tuatuaDatabase === pending) {
                    globalForDatabase.__tuatuaDatabase = undefined;
                }
                throw error;
            });
        globalForDatabase.__tuatuaDatabase = pending;
    }
    return globalForDatabase.__tuatuaDatabase;
}
