import { Events } from "@/server/database/entities/event";
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    type Relation,
} from "typeorm";

@Entity({ name: "event_sessions", schema: "public" })
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
}