import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1793706183275 implements MigrationInterface {
    name = 'Init1793706183275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token" text NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "ipAddress" character varying(255), "userAgent" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_sessions_token" ON "sessions"  ("token") `);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "accountId" text NOT NULL, "providerId" text NOT NULL, "password" text, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE, "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE, "scope" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_accounts_provider_account" ON "accounts"  ("providerId", "accountId") `);
        await queryRunner.query(`CREATE TABLE "event_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "event_id" uuid NOT NULL, CONSTRAINT "PK_dbe18de390df26f2dffc4ef3356" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "store_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "images" text array NOT NULL DEFAULT '{}', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_68863607048a1abd43772b314e" UNIQUE ("store_id"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_transaction_type" AS ENUM('TOPUP', 'PURCHASE', 'REFUND')`);
        await queryRunner.query(`CREATE TYPE "public"."wallet_transaction_status" AS ENUM('COMPLETED', 'PENDING', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "wallet_histories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "wallet_id" uuid NOT NULL, "type" "public"."wallet_transaction_type" NOT NULL, "status" "public"."wallet_transaction_status" NOT NULL DEFAULT 'COMPLETED', "amount" numeric(10,2) NOT NULL, "before" numeric(10,2) NOT NULL, "after" numeric(10,2) NOT NULL, "ref" uuid, "note" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_96914ecfcb43b8698974e420302" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid, "store_id" uuid, "total" numeric(10,2) NOT NULL DEFAULT '0.00', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_92558c08091598f7a4439586cd" UNIQUE ("user_id"), CONSTRAINT "REL_a7cd817a1911b067752865a53a" UNIQUE ("store_id"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_wallets_store_id" ON "wallets"  ("store_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_wallets_user_id" ON "wallets"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "stores" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "event_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "banner" text, "thumnail" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "slug" character varying(255) NOT NULL, "title" character varying(255) NOT NULL, "subTitle" character varying(255) NOT NULL, "banner" text NOT NULL, "thumnail" text NOT NULL, "vanue" character varying(255) NOT NULL, "description" text NOT NULL, "tags" character varying array NOT NULL DEFAULT '{}', "buyAt" TIMESTAMP WITH TIME ZONE NOT NULL, "buyendAt" TIMESTAMP WITH TIME ZONE NOT NULL, "minTicketQTY" integer NOT NULL DEFAULT '1', "maxTicketQTY" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_events_slug" ON "events"  ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."user_permission_code" AS ENUM('event.create', 'event.update', 'ticket.scan', 'token.topup', 'token.refund.approve', 'store.manage', 'store.sell', 'report.read', 'report.export', 'permission.manage')`);
        await queryRunner.query(`CREATE TABLE "user_role_permissions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_role_id" uuid NOT NULL, "permission" "public"."user_permission_code" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_420a5fa7fb38a884be42c60903e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_user_role_permissions_assignment_permission" ON "user_role_permissions"  ("user_role_id", "permission") `);
        await queryRunner.query(`CREATE TYPE "public"."user_roles_role_enum" AS ENUM('ADMIN', 'VENDOR', 'STAFF', 'USER')`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "role" "public"."user_roles_role_enum" NOT NULL, "event_id" uuid, "store_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_user_roles_user_role_scope" ON "user_roles"  ("user_id", "role", "event_id", "store_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "emailVerified" boolean NOT NULL DEFAULT false, "image" text, "username" character varying(255), "firstName" character varying(255), "lastName" character varying(255), "phone" character varying(10), "graduationAt" TIMESTAMP WITH TIME ZONE, "graduationInstitution" text, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_username" ON "users"  ("username") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_users_email" ON "users"  ("email") `);
        await queryRunner.query(`CREATE TABLE "verifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "identifier" text NOT NULL, "value" text NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2127ad1b143cf012280390b01d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3000dad1da61b29953f07476324" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_sessions" ADD CONSTRAINT "FK_58ce48ffbbdb12454db743d6cb0" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_68863607048a1abd43772b314ef" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_histories" ADD CONSTRAINT "FK_0b809c41ec74962cfa73f494585" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_a7cd817a1911b067752865a53a9" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stores" ADD CONSTRAINT "FK_d0bda0ba714f1abf0b928e0a57b" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role_permissions" ADD CONSTRAINT "FK_a6b2a262b22be30123d9d9fe519" FOREIGN KEY ("user_role_id") REFERENCES "user_roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_9e49be98b6351df87e61f2a94ca" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_22a1b84f98750f39414485ee9fd" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_22a1b84f98750f39414485ee9fd"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_9e49be98b6351df87e61f2a94ca"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "user_role_permissions" DROP CONSTRAINT "FK_a6b2a262b22be30123d9d9fe519"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_d0bda0ba714f1abf0b928e0a57b"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_a7cd817a1911b067752865a53a9"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`);
        await queryRunner.query(`ALTER TABLE "wallet_histories" DROP CONSTRAINT "FK_0b809c41ec74962cfa73f494585"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_68863607048a1abd43772b314ef"`);
        await queryRunner.query(`ALTER TABLE "event_sessions" DROP CONSTRAINT "FK_58ce48ffbbdb12454db743d6cb0"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3000dad1da61b29953f07476324"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_085d540d9f418cfbdc7bd55bb19"`);
        await queryRunner.query(`DROP TABLE "verifications"`);
        await queryRunner.query(`DROP INDEX "public"."uq_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."uq_users_username"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."uq_user_roles_user_role_scope"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TYPE "public"."user_roles_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."uq_user_role_permissions_assignment_permission"`);
        await queryRunner.query(`DROP TABLE "user_role_permissions"`);
        await queryRunner.query(`DROP TYPE "public"."user_permission_code"`);
        await queryRunner.query(`DROP INDEX "public"."uq_events_slug"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "stores"`);
        await queryRunner.query(`DROP INDEX "public"."uq_wallets_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."uq_wallets_store_id"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TABLE "wallet_histories"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transaction_status"`);
        await queryRunner.query(`DROP TYPE "public"."wallet_transaction_type"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "event_sessions"`);
        await queryRunner.query(`DROP INDEX "public"."uq_accounts_provider_account"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP INDEX "public"."uq_sessions_token"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
    }

}
