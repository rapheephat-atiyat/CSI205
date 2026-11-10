import "reflect-metadata";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { DataSource, QueryFailedError } from "typeorm";
import { PERMISSIONS } from "@/lib/permissions";
import { createDatabaseOptions } from "../database.options";
import { User, UserRole, UserRolePermission } from "../entities";
import { Role } from "../enums/role.enum";

// This runner never loads .env or DATABASE. Only this dedicated disposable local DB may be reset.
const databaseURL = process.env.TEST_DATABASE
    ?? "postgres://tuatua:tuatua@127.0.0.1:54329/tuatua_permissions_test";
const parsed = new URL(databaseURL);
if (!["127.0.0.1", "localhost"].includes(parsed.hostname)
    || parsed.port !== "54329"
    || parsed.pathname !== "/tuatua_permissions_test") {
    throw new Error("Permission integration tests require localhost:54329/tuatua_permissions_test only.");
}

let source: DataSource;
let firstUser: User;
let secondUser: User;
let firstStaff: UserRole;
let firstVendor: UserRole;
let secondStaff: UserRole;

function pgError(code: string): (error: unknown) => boolean {
    return (error) => error instanceof QueryFailedError
        && (error.driverError as { code?: string }).code === code;
}

before(async () => {
    source = new DataSource({
        ...createDatabaseOptions(databaseURL),
        poolSize: 2,
        synchronize: true,
        dropSchema: true,
    });
    await source.initialize();
});

after(async () => {
    if (source?.isInitialized) await source.destroy();
});

beforeEach(async () => {
    await source.query(`TRUNCATE user_role_permissions, user_roles, users CASCADE`);
    const users = source.getRepository(User);
    [firstUser, secondUser] = await users.save([
        users.create({ name: "First alumni", firstName: "First", lastName: "Alumni", email: "first@example.test" }),
        users.create({ name: "Second alumni", firstName: "Second", lastName: "Alumni", email: "second@example.test" }),
    ]);
    const roles = source.getRepository(UserRole);
    [firstStaff, firstVendor, secondStaff] = await roles.save([
        roles.create({ userId: firstUser.id, role: Role.STAFF }),
        roles.create({ userId: firstUser.id, role: Role.VENDOR }),
        roles.create({ userId: secondUser.id, role: Role.STAFF }),
    ]);
    const grants = source.getRepository(UserRolePermission);
    await grants.save([
        grants.create({ userRoleId: firstStaff.id, permission: PERMISSIONS.TICKET_SCAN }),
        grants.create({ userRoleId: firstVendor.id, permission: PERMISSIONS.STORE_SELL }),
        grants.create({ userRoleId: secondStaff.id, permission: PERMISSIONS.REPORT_READ }),
    ]);
});

test("two STAFF users load their own permissions and keep roles grouped", async () => {
    const users = source.getRepository(User);
    const [first, second] = await Promise.all([
        users.findOneOrFail({ where: { id: firstUser.id }, relations: { userRoles: { permissions: true } } }),
        users.findOneOrFail({ where: { id: secondUser.id }, relations: { userRoles: { permissions: true } } }),
    ]);
    const staffOfFirst = first.userRoles.find((assignment) => assignment.role === Role.STAFF);
    const vendorOfFirst = first.userRoles.find((assignment) => assignment.role === Role.VENDOR);
    assert.deepEqual(staffOfFirst?.permissions.map((grant) => grant.permission), [PERMISSIONS.TICKET_SCAN]);
    assert.deepEqual(vendorOfFirst?.permissions.map((grant) => grant.permission), [PERMISSIONS.STORE_SELL]);
    assert.equal(second.userRoles.length, 1);
    assert.deepEqual(second.userRoles[0].permissions.map((grant) => grant.permission), [PERMISSIONS.REPORT_READ]);
});

test("the same user cannot receive the same role twice", async () => {
    await assert.rejects(source.getRepository(UserRole).insert({ userId: firstUser.id, role: Role.STAFF }), pgError("23505"));
    assert.equal(await source.getRepository(UserRole).countBy({ userId: firstUser.id }), 2);
});

test("duplicate grants are rejected per assignment but the same code is allowed for another user", async () => {
    const grants = source.getRepository(UserRolePermission);
    await assert.rejects(grants.insert({ userRoleId: firstStaff.id, permission: PERMISSIONS.TICKET_SCAN }), pgError("23505"));
    await grants.insert({ userRoleId: secondStaff.id, permission: PERMISSIONS.TICKET_SCAN });
    assert.equal(await grants.countBy({ userRoleId: firstStaff.id }), 1);
    assert.equal(await grants.countBy({ userRoleId: secondStaff.id }), 2);
});

test("a permission cannot reference a role assignment that does not exist", async () => {
    await assert.rejects(source.getRepository(UserRolePermission).insert({
        userRoleId: randomUUID(), permission: PERMISSIONS.TICKET_SCAN,
    }), pgError("23503"));
});

test("removing one role assignment deletes only its grants", async () => {
    await source.getRepository(UserRole).delete(firstStaff.id);
    const grants = source.getRepository(UserRolePermission);
    assert.equal(await grants.countBy({ userRoleId: firstStaff.id }), 0);
    assert.equal(await grants.countBy({ userRoleId: firstVendor.id }), 1);
    assert.equal(await grants.countBy({ userRoleId: secondStaff.id }), 1);
    assert.equal(await source.getRepository(User).count(), 2);
});
