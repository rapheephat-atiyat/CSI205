import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialFoundation1792597114488 implements MigrationInterface {
    name = 'InitialFoundation1792597114488'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_event_roles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "event_id" uuid NOT NULL, "role" "public"."user_role" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "ck_user_event_roles_role" CHECK ("role" IN ('admin', 'staff', 'vendor')), CONSTRAINT "PK_a7c849ef0642657c17036b2536c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_user_event_roles_assignment" ON "user_event_roles"  ("user_id", "event_id", "role") `);
        await queryRunner.query(`CREATE TABLE "user_events" ("user_id" uuid NOT NULL, "event_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8f0129f0fada349745e8a14cb5b" PRIMARY KEY ("user_id", "event_id"))`);
        await queryRunner.query(`CREATE INDEX "ix_user_events_event_id" ON "user_events"  ("event_id") `);
        await queryRunner.query(`CREATE TABLE "user_permissions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "event_id" uuid NOT NULL, "permission" "public"."event_permission_code" NOT NULL, "effect" "public"."permission_effect" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_01f4295968ba33d73926684264f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_user_permissions_event_user_code" ON "user_permissions"  ("event_id", "user_id", "permission") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "role" "public"."user_role" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_user_roles_global" ON "user_roles"  ("user_id", "role") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "username" character varying(100) NOT NULL, "display_name" character varying(255) NOT NULL, "payload" uuid NOT NULL, "status" "public"."user_status" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_username" ON "users"  ("username") `);
        await queryRunner.query(`CREATE TYPE "public"."store_member_role" AS ENUM('owner', 'staff')`);
        await queryRunner.query(`CREATE TABLE "store_members" ("store_id" uuid NOT NULL, "user_id" uuid NOT NULL, "event_id" uuid NOT NULL, "role" "public"."store_member_role" NOT NULL DEFAULT 'staff', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e119dedd3232bbe7db331e06732" PRIMARY KEY ("store_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "ix_store_members_user_event" ON "store_members"  ("user_id", "event_id") `);
        await queryRunner.query(`CREATE TYPE "public"."store_approval_status" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TYPE "public"."store_operating_status" AS ENUM('closed', 'open')`);
        await queryRunner.query(`CREATE TABLE "stores" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "event_id" uuid NOT NULL, "slug" character varying(150) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "approval_status" "public"."store_approval_status" NOT NULL DEFAULT 'pending', "operating_status" "public"."store_operating_status" NOT NULL DEFAULT 'closed', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_stores_id_event" UNIQUE ("id", "event_id"), CONSTRAINT "ck_stores_open_requires_approval" CHECK ("operating_status" <> 'open' OR "approval_status" = 'approved'), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_stores_event_slug" ON "stores"  ("event_id", "slug") `);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "slug" character varying(150) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "venue" character varying(255), "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."event_status" NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "ck_events_dates" CHECK ("ends_at" > "starts_at"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_events_slug" ON "events"  ("slug") `);
        await queryRunner.query(`ALTER TABLE "user_event_roles" ADD CONSTRAINT "FK_13ae824792894b524807f7e610e" FOREIGN KEY ("user_id", "event_id") REFERENCES "user_events"("user_id","event_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_events" ADD CONSTRAINT "FK_ee5fe78baa6daa8bd2fa2392f53" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_events" ADD CONSTRAINT "FK_5d90e82a7c01f4b3a4cbf43a170" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_98ef71c133d1cadf53b7d73a9d8" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_658ac13f5a40343c71786eb5e7d" FOREIGN KEY ("user_id", "event_id") REFERENCES "user_events"("user_id","event_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_members" ADD CONSTRAINT "FK_e9a006e2fe10bd3fb7b0fad33d1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_members" ADD CONSTRAINT "FK_03fedd230aaf6698c8e99e6fd8f" FOREIGN KEY ("store_id", "event_id") REFERENCES "stores"("id","event_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "store_members" ADD CONSTRAINT "FK_3269ee38224b584f61fb97c764a" FOREIGN KEY ("user_id", "event_id") REFERENCES "user_events"("user_id","event_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stores" ADD CONSTRAINT "FK_d0bda0ba714f1abf0b928e0a57b" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_d0bda0ba714f1abf0b928e0a57b"`);
        await queryRunner.query(`ALTER TABLE "store_members" DROP CONSTRAINT "FK_3269ee38224b584f61fb97c764a"`);
        await queryRunner.query(`ALTER TABLE "store_members" DROP CONSTRAINT "FK_03fedd230aaf6698c8e99e6fd8f"`);
        await queryRunner.query(`ALTER TABLE "store_members" DROP CONSTRAINT "FK_e9a006e2fe10bd3fb7b0fad33d1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_658ac13f5a40343c71786eb5e7d"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_98ef71c133d1cadf53b7d73a9d8"`);
        await queryRunner.query(`ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"`);
        await queryRunner.query(`ALTER TABLE "user_events" DROP CONSTRAINT "FK_5d90e82a7c01f4b3a4cbf43a170"`);
        await queryRunner.query(`ALTER TABLE "user_events" DROP CONSTRAINT "FK_ee5fe78baa6daa8bd2fa2392f53"`);
        await queryRunner.query(`ALTER TABLE "user_event_roles" DROP CONSTRAINT "FK_13ae824792894b524807f7e610e"`);
        await queryRunner.query(`DROP INDEX "public"."uq_events_slug"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP INDEX "public"."uq_stores_event_slug"`);
        await queryRunner.query(`DROP TABLE "stores"`);
        await queryRunner.query(`DROP TYPE "public"."store_operating_status"`);
        await queryRunner.query(`DROP TYPE "public"."store_approval_status"`);
        await queryRunner.query(`DROP INDEX "public"."ix_store_members_user_event"`);
        await queryRunner.query(`DROP TABLE "store_members"`);
        await queryRunner.query(`DROP TYPE "public"."store_member_role"`);
        await queryRunner.query(`DROP INDEX "public"."uq_users_username"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."uq_user_roles_global"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."uq_user_permissions_event_user_code"`);
        await queryRunner.query(`DROP TABLE "user_permissions"`);
        await queryRunner.query(`DROP INDEX "public"."ix_user_events_event_id"`);
        await queryRunner.query(`DROP TABLE "user_events"`);
        await queryRunner.query(`DROP INDEX "public"."uq_user_event_roles_assignment"`);
        await queryRunner.query(`DROP TABLE "user_event_roles"`);
    }

}
