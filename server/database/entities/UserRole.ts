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
import { Role } from "../enums/role.enum";
import { User } from "./User";

@Entity({ name: "user_roles", schema: "public" })
@Index("uq_user_roles_global", ["userId", "role"], {
    unique: true,
})
export class UserRole {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", name: "user_id" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.userRoles, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @Column({
        type: "enum",
        enum: Role,
        enumName: "user_role",
    })
    role!: Role;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;
}
