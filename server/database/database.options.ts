import type { DataSourceOptions } from "typeorm";
import { databaseEntities } from "./entities";

export function createDatabaseOptions(databaseUrl: string): DataSourceOptions {
    if (!databaseUrl.trim()) {
        throw new Error("A database connection URL is required.");
    }

    return {
        type: "postgres",
        url: databaseUrl,
        schema: "public",
        entities: databaseEntities,
        uuidExtension: "pgcrypto",
        installExtensions: false,
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: false,
    };
}
