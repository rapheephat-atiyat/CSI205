import "reflect-metadata";

import assert from "node:assert/strict";
import { before, test } from "node:test";
import { DataSource } from "typeorm";
import {
    databaseEntities,
    Store,
    StoreMember,
    User,
    UserEvent,
    UserEventRole,
    UserPermission,
    UserRole,
} from "../entities";

class MetadataSource extends DataSource {
    async prepareMetadata(): Promise<void> {
        await this.buildMetadatas();
    }
}

const source = new MetadataSource({ type: "postgres", entities: databaseEntities });

before(async () => {
    await source.prepareMetadata();
});

test("all membership relations resolve without a database connection or extra ID columns", () => {
    assert.equal(source.isInitialized, false);
    assert.equal(source.entityMetadatas.length, 8);
    for (const metadata of source.entityMetadatas) {
        const names = metadata.columns.map((column) => column.databaseName);
        assert.equal(new Set(names).size, names.length);
        assert.equal(names.some((name) => /[A-Z]/.test(name)), false);
        for (const relation of metadata.relations) {
            assert.ok(relation.inverseEntityMetadata);
        }
    }
});

test("one user can load several events and stores through their own memberships", () => {
    const sql = source.getRepository(User)
        .createQueryBuilder("account")
        .leftJoinAndSelect("account.eventMemberships", "eventMember")
        .leftJoinAndSelect("eventMember.event", "event")
        .leftJoinAndSelect("eventMember.roles", "eventRole")
        .leftJoinAndSelect("account.storeMemberships", "storeMember")
        .leftJoinAndSelect("storeMember.store", "store")
        .getSql();

    assert.match(sql, /"eventMember"\."user_id"="account"\."id"/);
    assert.match(sql, /"storeMember"\."user_id"="account"\."id"/);
    assert.match(sql, /"store"\."event_id"="storeMember"\."event_id"/);
    assert.match(sql, /"eventRole"\."event_id"="eventMember"\."event_id"/);
});

test("store membership references the store and user membership in the same event", () => {
    const metadata = source.getMetadata(StoreMember);
    const store = metadata.findRelationWithPropertyPath("store");
    const eventMembership = metadata.findRelationWithPropertyPath("eventMembership");
    assert.ok(store);
    assert.ok(eventMembership);
    assert.deepEqual(store.joinColumns.map((column) => column.databaseName), ["store_id", "event_id"]);
    assert.deepEqual(
        store.joinColumns.map((column) => column.referencedColumn?.databaseName),
        ["id", "event_id"],
    );
    assert.deepEqual(eventMembership.joinColumns.map((column) => column.databaseName), ["user_id", "event_id"]);
    assert.deepEqual(
        source.getMetadata(UserEvent).primaryColumns.map((column) => column.databaseName),
        ["user_id", "event_id"],
    );
    assert.deepEqual(metadata.primaryColumns.map((column) => column.databaseName), ["store_id", "user_id"]);
    assert.ok(source.getMetadata(Store).uniques.some((unique) =>
        unique.columns.map((column) => column.databaseName).join(",") === "id,event_id",
    ));
});

test("event roles and individual permissions require a matching user-event membership", () => {
    for (const entity of [UserEventRole, UserPermission]) {
        const metadata = source.getMetadata(entity);
        const foreignKey = metadata.foreignKeys.find((key) => key.referencedEntityMetadata.target === UserEvent);
        assert.ok(foreignKey);
        assert.deepEqual(foreignKey.columnNames, ["user_id", "event_id"]);
        assert.deepEqual(foreignKey.referencedColumnNames, ["user_id", "event_id"]);
        assert.equal(foreignKey.onDelete, "RESTRICT");
    }
});

test("account roles no longer depend on the removed event_id column", () => {
    const metadata = source.getMetadata(UserRole);
    assert.equal(metadata.findColumnWithPropertyName("eventId"), undefined);
    const index = metadata.indices.find((item) => item.name === "uq_user_roles_global");
    assert.ok(index?.isUnique);
    assert.equal(index.where, undefined);
    assert.deepEqual(index.columns.map((column) => column.databaseName), ["user_id", "role"]);
});
