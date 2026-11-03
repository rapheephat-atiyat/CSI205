import { Events } from "@/server/database/entities/event";
import { Store } from "@/server/database/entities/Store";
import { User } from "@/server/database/entities/User";

import { UserRolePermission } from "@/server/database/entities/UserRolePermission";
import { Role } from "@/server/database/enums/role.enum";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    type Relation,
} from "typeorm";

@Entity({ name: "user_roles", schema: "public" })
@Index(
    "uq_user_roles_user_role_scope",
    ["userId", "role", "eventId", "storeId"],
    { unique: true },
)
export class UserRole {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "user_id",
        type: "uuid",
    })
    userId!: string;

    @ManyToOne(() => User, (u) => u.userRoles, {
        onDelete: "RESTRICT",
        nullable: false,
    })
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
    user!: Relation<User>;

    @Column({
        type: "enum",
        enum: Role,
    })
    role!: Role;

    @Column({
        name: "event_id",
        type: "uuid",
        nullable: true,
    })
    eventId!: string | null;

    @ManyToOne(() => Events, (event) => event.userRoles, {
        onDelete: "CASCADE",
        nullable: true,
    })
    @JoinColumn({ name: "event_id", referencedColumnName: "id" })
    event!: Relation<Events> | null;

    @Column({
        name: "store_id",
        type: "uuid",
        nullable: true,
    })
    storeId!: string | null;

    @ManyToOne(() => Store, (store) => store.userRoles, {
        onDelete: "CASCADE",
        nullable: true,
    })
    @JoinColumn({ name: "store_id", referencedColumnName: "id" })
    store!: Relation<Store> | null;

    @OneToMany(() => UserRolePermission, (permission) => permission.userRole)
    permissions!: Relation<UserRolePermission[]>;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;
}