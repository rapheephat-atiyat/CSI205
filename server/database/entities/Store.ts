import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
    type Relation,
} from "typeorm";
import { Event } from "./Event";
import { StoreMember } from "./StoreMember";

@Entity({ name: "stores", schema: "public" })
@Index("uq_stores_event_slug", ["eventId", "slug"], { unique: true })
@Unique("uq_stores_id_event", ["id", "eventId"])
@Check(
    "ck_stores_open_requires_approval",
    `"operating_status" <> 'open' OR "approval_status" = 'approved'`,
)
export class Store {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => Event, (event) => event.stores, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "event_id" })
    event!: Relation<Event>;

    @Column({ type: "varchar", length: 150 })
    slug!: string;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({
        name: "approval_status",
        type: "enum",
        enum: ["pending", "approved", "rejected"],
        enumName: "store_approval_status",
        default: "pending",
    })
    approvalStatus!: "pending" | "approved" | "rejected";

    @Column({
        name: "operating_status",
        type: "enum",
        enum: ["closed", "open"],
        enumName: "store_operating_status",
        default: "closed",
    })
    operatingStatus!: "closed" | "open";

    @OneToMany(() => StoreMember, (membership) => membership.store)
    members!: Relation<StoreMember[]>;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
