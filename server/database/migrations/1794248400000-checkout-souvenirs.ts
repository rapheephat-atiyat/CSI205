import type { MigrationInterface, QueryRunner } from "typeorm";

export class CheckoutSouvenirs1794248400000 implements MigrationInterface {
    name = "CheckoutSouvenirs1794248400000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE public.events ADD COLUMN souvenir_price numeric(10, 2)");
        await queryRunner.query("ALTER TABLE public.orders ADD COLUMN souvenir_items jsonb NOT NULL DEFAULT '[]'::jsonb");
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE public.orders DROP COLUMN souvenir_items");
        await queryRunner.query("ALTER TABLE public.events DROP COLUMN souvenir_price");
    }
}
