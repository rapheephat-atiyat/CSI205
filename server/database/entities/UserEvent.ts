import {
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
    type Relation,
} from "typeorm";
import { Event } from "./Event";
import { StoreMember } from "./StoreMember";
import { User } from "./User";
import { UserPermission } from "./UserPermission";
import { UserEventRole } from "./UserEventRole";

@Entity({ name: "user_events", schema: "public" })
@Index("ix_user_events_event_id", ["eventId"])
export class UserEvent {
    @PrimaryColumn({ name: "user_id", type: "uuid" })
    userId!: string;

    @PrimaryColumn({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => User, (user) => user.eventMemberships, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @ManyToOne(() => Event, (event) => event.memberships, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "event_id" })
    event!: Relation<Event>;

    @OneToMany(() => UserEventRole, (assignment) => assignment.membership)
    roles!: Relation<UserEventRole[]>;

    @OneToMany(() => StoreMember, (membership) => membership.eventMembership)
    storeMemberships!: Relation<StoreMember[]>;

    @OneToMany(() => UserPermission, (permission) => permission.eventMembership)
    permissions!: Relation<UserPermission[]>;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;
}
