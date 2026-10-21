import "server-only";
import "reflect-metadata";

import { DataSource } from "typeorm";
import { createDatabaseOptions } from "./database.options";

export function createDatabaseSource(databaseUrl: string): DataSource {
    return new DataSource(createDatabaseOptions(databaseUrl));
}
