import "reflect-metadata";

import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { DataSource } from "typeorm";
import { createDatabaseOptions } from "./database.options";

loadEnvConfig(resolve(__dirname, "../.."), process.env.NODE_ENV !== "production");

const databaseUrl = process.env.DATABASE;

if (!databaseUrl?.trim()) {
    throw new Error("Set DATABASE in the project .env file before running migrations.");
}

const migrationDataSource = new DataSource({
    ...createDatabaseOptions(databaseUrl),
    migrations: [resolve(__dirname, "migrations", "*.ts")],
    migrationsTableName: "tuatua_migrations",
    migrationsTransactionMode: "all",
});

export default migrationDataSource;
