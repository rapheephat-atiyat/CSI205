import { User } from "@/server/database/entities/User";
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
import { UserRolePermission } from "./UserRolePermission";

@Entity({ name: "user_roles", schema: "public" })
@Index("uq_user_roles_user_role", ["userId", "role"], { unique: true })
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

    @OneToMany(() => UserRolePermission, (permission) => permission.userRole)
    permissions!: Relation<UserRolePermission[]>;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;
}
