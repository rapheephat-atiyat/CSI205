import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";

import { User } from "./User";

@Entity({ name: "accounts", schema: "public" })
@Index(
    "uq_accounts_provider_account",
    ["providerId", "accountId"],
    { unique: true },
)
export class Account {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "user_id",
        type: "uuid",
    })
    userId!: string;

    @ManyToOne(() => User, (user) => user.accounts, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
    })
    user!: Relation<User>;

    @Column({ type: "text" })
    accountId!: string;

    @Column({ type: "text" })
    providerId!: string;

    @Column({ type: "text", nullable: true })
    password!: string | null;

    @Column({ type: "text", nullable: true })
    accessToken!: string | null;

    @Column({ type: "text", nullable: true })
    refreshToken!: string | null;

    @Column({ type: "text", nullable: true })
    idToken!: string | null;

    @Column({ type: "timestamptz", nullable: true })
    accessTokenExpiresAt!: Date | null;

    @Column({ type: "timestamptz", nullable: true })
    refreshTokenExpiresAt!: Date | null;

    @Column({ type: "text", nullable: true })
    scope!: string | null;

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