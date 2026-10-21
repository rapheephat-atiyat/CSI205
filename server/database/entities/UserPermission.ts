import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";
import { PERMISSIONS } from "../../../lib/permissions";
import { Event } from "./Event";
import { User } from "./User";
import { UserEvent } from "./UserEvent";

type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type EventPermissionCode = Exclude<
    PermissionCode,
    typeof PERMISSIONS.EVENT_CREATE
>;

const eventPermissionCodes = Object.values(PERMISSIONS).filter(
    (permission): permission is EventPermissionCode =>
        permission !== PERMISSIONS.EVENT_CREATE,
);

@Entity({ name: "user_permissions", schema: "public" })
@Index(
    "uq_user_permissions_event_user_code",
    ["eventId", "userId", "permission"],
    { unique: true },
)
export class UserPermission {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User, (user) => user.userPermissions, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => Event, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "event_id" })
    event!: Relation<Event>;

    @ManyToOne(() => UserEvent, (membership) => membership.permissions, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn([
        { name: "user_id", referencedColumnName: "userId" },
        { name: "event_id", referencedColumnName: "eventId" },
    ])
    eventMembership!: Relation<UserEvent>;

    @Column({
        name: "permission",
        type: "enum",
        enum: eventPermissionCodes,
        enumName: "event_permission_code",
    })
    permission!: EventPermissionCode;

    @Column({
        name: "effect",
        type: "enum",
        enum: ["allow", "deny"],
        enumName: "permission_effect",
    })
    effect!: "allow" | "deny";

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
