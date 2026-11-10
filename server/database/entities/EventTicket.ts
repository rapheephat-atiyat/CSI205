import { Events } from "@/server/database/entities/Event";
import { Ticket } from "@/server/database/entities/Ticket";
import { type AttendeeField } from "@/server/database/enums/domain.enum";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";

@Entity({ name: "ticket_types", schema: "public" })
export class EventTicket {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => Events, (e) => e.tickets, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "event_id", referencedColumnName: "id" })
    event!: Relation<Events>;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price!: string;

    @Column({ type: "int" })
    quota!: number;

    @Column({ type: "int", default: 0 })
    sold!: number;

    @Column({ type: "int", default: 1 })
    minTicketQTY!: number;

    @Column({ type: "int", default: 1 })
    maxTicketQTY!: number;

    @Column({ type: "int", default: 0 })
    sortOrder!: number;

    @Column({ type: "boolean", default: true })
    isActive!: boolean;

    @OneToMany(() => Ticket, (t) => t.eventTicket)
    issuedTickets!: Relation<Ticket[]>;

    @Column({ name: "includes_souvenir", type: "boolean", default: true })
    includesSouvenir!: boolean;

    @Column({ name: "required_fields", type: "varchar", array: true, default: [] })
    requiredFields!: AttendeeField[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
