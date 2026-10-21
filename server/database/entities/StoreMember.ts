import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";
import { Store } from "./Store";
import { User } from "./User";
import { UserEvent } from "./UserEvent";

@Entity({ name: "store_members", schema: "public" })
@Index("ix_store_members_user_event", ["userId", "eventId"])
export class StoreMember {
    @PrimaryColumn({ name: "store_id", type: "uuid" })
    storeId!: string;

    @PrimaryColumn({ name: "user_id", type: "uuid" })
    userId!: string;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => User, (user) => user.storeMemberships, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<User>;

    @ManyToOne(() => Store, (store) => store.members, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn([
        { name: "store_id", referencedColumnName: "id" },
        { name: "event_id", referencedColumnName: "eventId" },
    ])
    store!: Relation<Store>;

    @ManyToOne(() => UserEvent, (membership) => membership.storeMemberships, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn([
        { name: "user_id", referencedColumnName: "userId" },
        { name: "event_id", referencedColumnName: "eventId" },
    ])
    eventMembership!: Relation<UserEvent>;

    @Column({
        type: "enum",
        enum: ["owner", "staff"],
        enumName: "store_member_role",
        default: "staff",
    })
    role!: "owner" | "staff";

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
