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

@Entity({ name: "sessions", schema: "public" })
@Index("uq_sessions_token", ["token"], { unique: true })
export class Session {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "user_id",
        type: "uuid",
    })
    userId!: string;

    @ManyToOne(() => User, (user) => user.sessions, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "id",
    })
    user!: Relation<User>;

    @Column({ type: "text" })
    token!: string;

    @Column({ type: "timestamptz" })
    expiresAt!: Date;

    @Column({ type: "varchar", length: 255, nullable: true })
    ipAddress!: string | null;

    @Column({ type: "text", nullable: true })
    userAgent!: string | null;

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