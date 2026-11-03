import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
} from "typeorm";

import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { UserRole } from "./UserRole";

/** A grant belongs to one user's role assignment, not every user with the same role name. */
@Entity({ name: "user_role_permissions", schema: "public" })
@Index(
    "uq_user_role_permissions_assignment_permission",
    ["userRoleId", "permission"],
    { unique: true },
)
export class UserRolePermission {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "user_role_id",
        type: "uuid",
    })
    userRoleId!: string;

    @ManyToOne(() => UserRole, (userRole) => userRole.permissions, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_role_id", referencedColumnName: "id" })
    userRole!: Relation<UserRole>;

    @Column({
        type: "enum",
        enum: Object.values(PERMISSIONS),
        enumName: "user_permission_code",
    })
    permission!: Permission;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;
}
