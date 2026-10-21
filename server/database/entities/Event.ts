import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";
import { Store } from "./Store";
import { UserEvent } from "./UserEvent";

@Entity({ name: "events", schema: "public" })
@Index("uq_events_slug", ["slug"], { unique: true })
@Check("ck_events_dates", '"ends_at" > "starts_at"')
export class Event {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "slug",
        type: "varchar",
        length: 150,
    })
    slug!: string;

    @Column({
        name: "name",
        type: "varchar",
        length: 255,
    })
    name!: string;

    @Column({
        name: "description",
        type: "text",
        nullable: true,
    })
    description!: string | null;

    @Column({
        name: "venue",
        type: "varchar",
        length: 255,
        nullable: true,
    })
    venue!: string | null;

    @Column({
        name: "starts_at",
        type: "timestamptz",
    })
    startsAt!: Date;

    @Column({
        name: "ends_at",
        type: "timestamptz",
    })
    endsAt!: Date;

    @Column({
        name: "status",
        type: "enum",
        enum: ["draft", "published", "completed", "cancelled"],
        enumName: "event_status",
        default: "draft",
    })
    status!: "draft" | "published" | "completed" | "cancelled";

    @OneToMany(() => UserEvent, (membership) => membership.event)
    memberships!: Relation<UserEvent[]>;

    @OneToMany(() => Store, (store) => store.event)
    stores!: Relation<Store[]>;

    @CreateDateColumn({
        name: "created_at",
        type: "timestamptz",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
        type: "timestamptz",
    })
    updatedAt!: Date;
}
