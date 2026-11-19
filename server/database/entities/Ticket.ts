import { Events } from "@/server/database/entities/Event";
import type { TicketSouvenir } from "@/lib/api-types";
import { EventTicket } from "@/server/database/entities/EventTicket";
import { Order } from "@/server/database/entities/Order";
import { User } from "@/server/database/entities/User";
import { TICKET_STATUSES, type TicketStatus } from "@/server/database/enums/domain.enum";
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

@Entity({ name: "tickets", schema: "public" })
@Index("uq_tickets_ticket_code", ["ticketCode"], { unique: true })
@Index("uq_tickets_qr_token", ["qrToken"], { unique: true })
@Check("chk_tickets_unit_price", `"unitPrice" >= 0`)
export class Ticket {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "order_id", type: "uuid" })
    orderId!: string;

    @ManyToOne(() => Order, (o) => o.tickets, { onDelete: "CASCADE", nullable: false })
    @JoinColumn([
        { name: "order_id", referencedColumnName: "id", foreignKeyConstraintName: "fk_tickets_order_buyer_event" },
        { name: "event_id", referencedColumnName: "eventId" },
        { name: "user_id", referencedColumnName: "userId" },
    ])
    order!: Relation<Order>;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => Events, { onDelete: "RESTRICT", nullable: false })
    @JoinColumn({ name: "event_id", referencedColumnName: "id" })
    event!: Relation<Events>;

    @Column({ name: "event_ticket_id", type: "uuid" })
    eventTicketId!: string;

    @ManyToOne(() => EventTicket, (et) => et.issuedTickets, { onDelete: "RESTRICT", nullable: false })
    @JoinColumn([
        { name: "event_ticket_id", referencedColumnName: "id", foreignKeyConstraintName: "fk_tickets_ticket_type_event" },
        { name: "event_id", referencedColumnName: "eventId" },
    ])
    eventTicket!: Relation<EventTicket>;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User, (u) => u.tickets, { onDelete: "RESTRICT", nullable: false })
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
    user!: Relation<User>;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    unitPrice!: string;

    @Column({ type: "varchar", length: 50 })
    ticketCode!: string;

    @Column({ type: "varchar", length: 128 })
    qrToken!: string;

    @Column({
        type: "enum",
        enum: Object.values(TICKET_STATUSES),
        enumName: "ticket_status",
        default: TICKET_STATUSES.PENDING,
    })
    status!: TicketStatus;

    @Column({ type: "varchar", length: 255, nullable: true })
    firstName!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    lastName!: string | null;

    @Column({ type: "varchar", length: 10, nullable: true })
    phone!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    email!: string | null;

    @Column({ type: "varchar", length: 10, nullable: true })
    graduationYear!: string | null;

    @Column({ name: "checked_in_at", type: "timestamptz", nullable: true })
    checkedInAt!: Date | null;

    @Column({ name: "checked_in_by_id", type: "uuid", nullable: true })
    checkedInById!: string | null;

    @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "checked_in_by_id", referencedColumnName: "id" })
    checkedInBy!: Relation<User> | null;

    @Column({ name: "souvenir_items", type: "jsonb", default: [] })
    souvenirItems!: TicketSouvenir[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
