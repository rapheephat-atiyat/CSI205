import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";
import { UserPermission } from "./UserPermission";
import { UserRole } from "./UserRole";
import { UserEvent } from "./UserEvent";
import { StoreMember } from "./StoreMember";

@Entity({ name: "users", schema: "public" })
@Index("uq_users_username", ["username"], { unique: true })
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "username",
        type: "varchar",
        length: 100,
    })
    username!: string;

    @Column({ name: "display_name", type: "varchar", length: 255 })
    displayName!: string;

    @Column({ type: "uuid" })
    payload!: string;

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    userRoles!: Relation<UserRole[]>;

    @OneToMany(() => UserPermission, (userPermission) => userPermission.user)
    userPermissions!: Relation<UserPermission[]>;

    @OneToMany(() => UserEvent, (membership) => membership.user)
    eventMemberships!: Relation<UserEvent[]>;

    @OneToMany(() => StoreMember, (membership) => membership.user)
    storeMemberships!: Relation<StoreMember[]>;

    @Column({
        name: "status",
        type: "enum",
        enum: ["active", "suspended"],
        enumName: "user_status",
        default: "active",
    })
    status!: "active" | "suspended";

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
