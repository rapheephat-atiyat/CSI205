import { Store } from "@/server/database/entities/Store";
import { User } from "@/server/database/entities/User";
import { WalletHistory } from "@/server/database/entities/WalletHistory";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm";

@Entity({ name: "wallets", schema: "public" })
@Index("uq_wallets_user_id", ["userId"], { unique: true })
@Index("uq_wallets_store_id", ["storeId"], { unique: true })
export class Wallet {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid", nullable: true })
    userId!: string | null;

    @OneToOne(() => User, (user) => user.wallet, {
        onDelete: "RESTRICT",
        nullable: true,
    })
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
    user!: Relation<User> | null;

    @Column({ name: "store_id", type: "uuid", nullable: true })
    storeId!: string | null;

    @OneToOne(() => Store, (store) => store.wallet, {
        onDelete: "RESTRICT",
        nullable: true,
    })
    @JoinColumn({ name: "store_id", referencedColumnName: "id" })
    store!: Relation<Store> | null;

    @Column({ type: "decimal", precision: 10, scale: 2, default: "0.00" })
    total!: string;

    @OneToMany(() => WalletHistory, (wh) => wh.wallet)
    walletHistories!: Relation<WalletHistory[]>

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