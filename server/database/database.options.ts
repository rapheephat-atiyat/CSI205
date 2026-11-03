import type { DataSourceOptions } from "typeorm";
import pg from "pg";
import { databaseEntities } from "./entities";

type PostgresOptions = Extract<DataSourceOptions, { type: "postgres" }>;

export function createDatabaseOptions(databaseUrl: string): PostgresOptions {
    if (!databaseUrl.trim()) {
        throw new Error("A database connection URL is required.");
    }

    return {
        type: "postgres",
        driver: pg,
        url: databaseUrl,
        schema: "public",
        entities: databaseEntities,
        uuidExtension: "pgcrypto",
        installExtensions: false,
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: false,
        poolSize: Number(process.env.DATABASE_POOL_MAX ?? 5),
        extra: {
            connectionTimeoutMillis: 10_000,
            idleTimeoutMillis: 30_000,
        },
    };
}
