import {
    Check,
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
import { UserEvent } from "./UserEvent";

@Entity({ name: "user_event_roles", schema: "public" })
@Index("uq_user_event_roles_assignment", ["userId", "eventId", "role"], {
    unique: true,
})
@Check("ck_user_event_roles_role", `"role" IN ('admin', 'staff', 'vendor')`)
export class UserEventRole {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => UserEvent, (membership) => membership.roles, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn([
        { name: "user_id", referencedColumnName: "userId" },
        { name: "event_id", referencedColumnName: "eventId" },
    ])
    membership!: Relation<UserEvent>;

    @Column({ type: "enum", enum: Role, enumName: "user_role" })
    role!: Role.ADMIN | Role.STAFF | Role.VENDOR;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
