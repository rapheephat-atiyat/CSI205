import { type MigrationInterface, type QueryRunner } from "typeorm";

export class TicketTokenRewards1795122000000 implements MigrationInterface {
    name = "TicketTokenRewards1795122000000";

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE public.ticket_types
            ADD COLUMN token_reward integer NOT NULL DEFAULT 0,
            ADD CONSTRAINT chk_ticket_types_token_reward CHECK (token_reward BETWEEN 0 AND 99999999)`);
        await queryRunner.query(`ALTER TABLE public.tickets
            ADD COLUMN token_reward integer NOT NULL DEFAULT 0,
            ADD CONSTRAINT chk_tickets_token_reward CHECK (token_reward BETWEEN 0 AND 99999999)`);
        await queryRunner.query(`ALTER TYPE public.wallet_transaction_type ADD VALUE 'TICKET_REWARD'`);
        await queryRunner.query(`ALTER TABLE public.wallet_histories
            ADD COLUMN baht_per_token numeric(10, 2),
            ADD COLUMN baht_amount numeric(18, 2)`);
        await queryRunner.query(`CREATE TABLE public.token_pricing (
            id uuid CONSTRAINT pk_token_pricing PRIMARY KEY,
            baht_per_token numeric(10, 2) NOT NULL,
            updated_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT chk_token_pricing_singleton CHECK (id = '00000000-0000-4000-8000-000000000001'),
            CONSTRAINT chk_token_pricing_rate CHECK (baht_per_token > 0)
        )`);
        await queryRunner.query(`INSERT INTO public.token_pricing (id, baht_per_token)
            VALUES ('00000000-0000-4000-8000-000000000001', 1.00)`);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE public.token_pricing`);
        await queryRunner.query(`ALTER TABLE public.wallet_histories DROP COLUMN baht_per_token, DROP COLUMN baht_amount`);
        await queryRunner.query(`ALTER TYPE public.wallet_transaction_type RENAME TO wallet_transaction_type_with_reward`);
        await queryRunner.query(`CREATE TYPE public.wallet_transaction_type AS ENUM ('TOPUP', 'PURCHASE', 'REFUND')`);
        // Keep reward credits in the ledger using a credit type supported by the old app.
        await queryRunner.query(`ALTER TABLE public.wallet_histories
            ALTER COLUMN type TYPE public.wallet_transaction_type
            USING (CASE WHEN type::text = 'TICKET_REWARD' THEN 'TOPUP' ELSE type::text END)::public.wallet_transaction_type`);
        await queryRunner.query(`DROP TYPE public.wallet_transaction_type_with_reward`);
        await queryRunner.query(`ALTER TABLE public.tickets DROP COLUMN token_reward`);
        await queryRunner.query(`ALTER TABLE public.ticket_types DROP COLUMN token_reward`);
    }
}
