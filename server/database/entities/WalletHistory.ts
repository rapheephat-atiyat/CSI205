import { Wallet } from "@/server/database/entities/Wallet";
import { TRANSACTION_STATUSES, TRANSACTION_TYPES, type TransactionStatus, type TransactionType } from "@/server/database/enums/domain.enum";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from "typeorm";

@Entity({ name: "wallet_histories", schema: "public" })
export class WalletHistory {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", name: "wallet_id" })
    walletId!: string;

    @ManyToOne(() => Wallet, (w) => w.walletHistories, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "wallet_id", referencedColumnName: "id" })
    wallet!: Relation<Wallet>

    @Column({
        type: "enum",
        enum: Object.values(TRANSACTION_TYPES),
        enumName: "wallet_transaction_type",
    })
    type!: TransactionType;
    @Column({
        type: "enum",
        enum: Object.values(TRANSACTION_STATUSES),
        enumName: "wallet_transaction_status",
        default: TRANSACTION_STATUSES.COMPLETED,
    })
    status!: TransactionStatus;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    before!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    after!: string;

    @Column({ type: "uuid", nullable: true })
    ref!: string;

    @Column({ type: "text", nullable: true })
    note!: string;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;
}