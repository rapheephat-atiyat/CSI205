import { Check, Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

export const TOKEN_PRICING_ID = "00000000-0000-4000-8000-000000000001";

@Entity({ name: "token_pricing", schema: "public" })
@Check("chk_token_pricing_singleton", `"id" = '${TOKEN_PRICING_ID}'`)
@Check("chk_token_pricing_rate", `"baht_per_token" > 0`)
export class TokenPricing {
    @PrimaryColumn("uuid", { primaryKeyConstraintName: "pk_token_pricing" })
    id!: string;

    @Column({ name: "baht_per_token", type: "decimal", precision: 10, scale: 2 })
    bahtPerToken!: string;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
