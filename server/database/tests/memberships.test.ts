import "reflect-metadata";

import assert from "node:assert/strict";
import { before, test } from "node:test";
import { DataSource } from "typeorm";
import { databaseEntities, User, UserRole, UserRolePermission } from "../entities";

class MetadataSource extends DataSource {
    async prepare(): Promise<void> {
        await this.buildMetadatas();
    }
}

const source = new MetadataSource({ type: "postgres", entities: databaseEntities });

before(async () => {
    await source.prepare();
});

test("the permission owner path is User -> UserRole -> UserRolePermission", () => {
    const userRoles = source.getMetadata(User).findRelationWithPropertyPath("userRoles");
    const permissions = source.getMetadata(UserRole).findRelationWithPropertyPath("permissions");
    const owner = source.getMetadata(UserRolePermission).findRelationWithPropertyPath("userRole");
    assert.equal(userRoles?.inverseEntityMetadata.target, UserRole);
    assert.equal(permissions?.inverseEntityMetadata.target, UserRolePermission);
    assert.equal(owner?.inverseEntityMetadata.target, UserRole);
    assert.deepEqual(owner?.joinColumns.map((column) => column.databaseName), ["user_role_id"]);
    assert.equal(owner?.isNullable, false);
    assert.equal(owner?.onDelete, "CASCADE");
    assert.equal(source.isInitialized, false);
});

test("loading a user's nested permissions follows their own role assignments", () => {
    const query = source.getRepository(User)
        .createQueryBuilder("account")
        .leftJoinAndSelect("account.userRoles", "assignment")
        .leftJoinAndSelect("assignment.permissions", "grant")
        .where("account.id = :userId", { userId: "11111111-1111-4111-8111-111111111111" });
    const [sql, parameters] = query.getQueryAndParameters();
    assert.match(sql, /"assignment"\."user_id"="account"\."id"/);
    assert.match(sql, /"grant"\."user_role_id"="assignment"\."id"/);
    assert.deepEqual(parameters, ["11111111-1111-4111-8111-111111111111"]);
    assert.equal(source.hasMetadata("role_permissions"), false);
});
