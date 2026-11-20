import type { MigrationInterface, QueryRunner } from "typeorm";

export class BookingAttendanceDate1795140000000 implements MigrationInterface {
    name = "BookingAttendanceDate1795140000000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE public.orders ADD COLUMN attendance_date date`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE public.orders DROP COLUMN attendance_date`);
    }
}
