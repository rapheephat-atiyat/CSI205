import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";

import { Session } from "./Session";
import { Account } from "./Account";
import { UserRole } from "./UserRole";

@Entity({ name: "users", schema: "public" })
@Index("uq_users_email", ["email"], { unique: true })
@Index("uq_users_username", ["username"], { unique: true })
export class User {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "varchar", length: 255 })
    email!: string;

    @Column({ type: "boolean", default: false })
    emailVerified!: boolean;

    @Column({ type: "text", nullable: true })
    image!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    username!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    firstName!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    lastName!: string | null;

    @Column({ type: "varchar", length: 10, nullable: true })
    phone!: string | null;

    @Column({ type: "timestamptz", nullable: true })
    graduationAt!: Date | null;

    @Column({ type: "text", nullable: true })
    graduationInstitution!: string | null;

    @Column({
        type: "varchar",
        length: 20,
        default: "ACTIVE",
    })
    status!: "ACTIVE" | "SUSPENDED";

    @OneToMany(() => Session, (session) => session.user)
    sessions!: Relation<Session[]>;

    @OneToMany(() => Account, (account) => account.user)
    accounts!: Relation<Account[]>;

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    userRoles!: Relation<UserRole[]>;

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