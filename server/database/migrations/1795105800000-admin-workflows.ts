import type { MigrationInterface, QueryRunner } from "typeorm";

export class AdminWorkflows1795105800000 implements MigrationInterface {
    name = "AdminWorkflows1795105800000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await replacePermissionEnum(queryRunner, [...previousPermissions, "order.review"]);
        await queryRunner.query(`ALTER TABLE "orders" ADD "review_decision" varchar(10), ADD "reviewed_by_id" uuid, ADD "reviewed_at" timestamptz, ADD "review_reason" varchar(500)`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "fk_orders_reviewer" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`CREATE TABLE "admin_activities" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(), "event_id" uuid, "actor_id" uuid,
            "action" varchar(80) NOT NULL, "target_id" uuid NOT NULL, "note" varchar(500),
            "created_at" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "pk_admin_activities" PRIMARY KEY ("id"),
            CONSTRAINT "fk_admin_activities_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL,
            CONSTRAINT "fk_admin_activities_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
        )`);
        await queryRunner.query(`CREATE INDEX "idx_admin_activities_event_date" ON "admin_activities" ("event_id", "created_at")`);
        // Older UI created event ADMIN assignments without any grants. Repair those empty assignments only.
        await queryRunner.query(`INSERT INTO "admin_activities" ("event_id", "action", "target_id", "note")
            SELECT r.event_id, 'role.legacy-defaults', r.id, 'เพิ่มสิทธิ์เริ่มต้นให้ ADMIN ของงานที่ไม่มีสิทธิ์จาก UI เดิม'
            FROM "user_roles" r WHERE r.role = 'ADMIN' AND r.event_id IS NOT NULL AND r.store_id IS NULL
            AND NOT EXISTS (SELECT 1 FROM "user_role_permissions" p WHERE p.user_role_id = r.id)`);
        await queryRunner.query(`INSERT INTO "user_role_permissions" ("user_role_id", "permission")
            SELECT r.id, p.permission::public.user_permission_code FROM "user_roles" r CROSS JOIN
            unnest(ARRAY['event.update','order.review','ticket.scan','store.manage','report.read','report.export','permission.manage']) p(permission)
            WHERE r.role = 'ADMIN' AND r.event_id IS NOT NULL AND r.store_id IS NULL
            AND NOT EXISTS (SELECT 1 FROM "user_role_permissions" existing WHERE existing.user_role_id = r.id)`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "user_role_permissions" WHERE "user_role_id" IN
            (SELECT "target_id" FROM "admin_activities" WHERE "action" = 'role.legacy-defaults')`);
        await queryRunner.query(`DELETE FROM "user_role_permissions" WHERE "permission"::text = 'order.review'`);
        await queryRunner.query(`DROP TABLE "admin_activities"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "fk_orders_reviewer"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "review_decision", DROP COLUMN "reviewed_by_id", DROP COLUMN "reviewed_at", DROP COLUMN "review_reason"`);
        await replacePermissionEnum(queryRunner, previousPermissions);
    }
}

const previousPermissions = ['event.create', 'event.update', 'ticket.scan', 'token.topup', 'token.refund.approve', 'store.manage', 'store.sell', 'report.read', 'report.export', 'permission.manage'];

async function replacePermissionEnum(queryRunner: QueryRunner, permissions: string[]) {
    // Recreate the enum so the new value is usable in the same transactional migration.
    await queryRunner.query(`ALTER TYPE "public"."user_permission_code" RENAME TO "user_permission_code_previous"`);
    await queryRunner.query(`CREATE TYPE "public"."user_permission_code" AS ENUM (${permissions.map((value) => `'${value}'`).join(',')})`);
    await queryRunner.query(`ALTER TABLE "user_role_permissions" ALTER COLUMN "permission" TYPE "public"."user_permission_code" USING "permission"::text::"public"."user_permission_code"`);
    await queryRunner.query(`DROP TYPE "public"."user_permission_code_previous"`);
}
