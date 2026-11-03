import { WalletHistory } from "@/server/database/entities/WalletHistory";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm";

@Entity({ name: "wallets", schema: "public" })
export class Wallet {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255, nullable: false })
    title!: string

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0.00 })
    total!: number;

    @OneToMany(() => WalletHistory, (wh) => wh.wallet)
    walletHistories!: Relation<WalletHistory>

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
    })
    updatedAt!: Date;
}