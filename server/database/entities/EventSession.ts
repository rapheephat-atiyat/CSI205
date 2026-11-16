import { Events } from "@/server/database/entities/Event";
import {
    Check,
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

@Entity({ name: "event_sessions", schema: "public" })
@Index("idx_event_sessions_start", ["eventId", "startsAt"])
@Check("chk_event_sessions_title", `btrim("title") <> ''`)
@Check("chk_event_sessions_time", `("starts_at" IS NULL AND "ends_at" IS NULL)
    OR ("starts_at" IS NOT NULL AND "ends_at" IS NOT NULL AND "starts_at" < "ends_at")`)
export class EventSession {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", name: "event_id" })
    eventId!: string;

    @ManyToOne(() => Events, (e) => e.sessions, {
        onDelete: "CASCADE",
        nullable: false,
    })
    @JoinColumn({ name: "event_id", referencedColumnName: "id" })
    event!: Relation<Events>;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ name: "starts_at", type: "timestamptz", nullable: true })
    startsAt!: Date | null;

    @Column({ name: "ends_at", type: "timestamptz", nullable: true })
    endsAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
