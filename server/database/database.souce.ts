import "server-only";
import "reflect-metadata";

import { DataSource } from "typeorm";
import { createDatabaseOptions } from "./database.options";
import { databaseEntities } from "./entities";
import { getCachedInitialization } from "./initialization-cache";

export function createDatabaseSource(databaseUrl: string): DataSource {
    return new DataSource(createDatabaseOptions(databaseUrl));
}

const globalForDatabase = globalThis as typeof globalThis & {
    __tuatuaDatabases?: WeakMap<object, Promise<DataSource>>;
};

export function getDatabase(): Promise<DataSource> {
    const cache = globalForDatabase.__tuatuaDatabases ??= new WeakMap();
    return getCachedInitialization(cache, databaseEntities, async () => {
        const databaseUrl = process.env.DATABASE;
        if (!databaseUrl?.trim()) {
            throw new Error("DATABASE is not configured.");
        }
        return createDatabaseSource(databaseUrl).initialize();
    });
}
