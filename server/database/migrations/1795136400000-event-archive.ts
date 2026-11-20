import type { MigrationInterface, QueryRunner } from "typeorm";

export class EventArchive1795136400000 implements MigrationInterface {
    name = "EventArchive1795136400000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE public.events ADD COLUMN archived_at timestamptz`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE public.events DROP COLUMN archived_at`);
    }
}
