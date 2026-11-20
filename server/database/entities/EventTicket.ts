import { Events } from "@/server/database/entities/Event";
import { Ticket } from "@/server/database/entities/Ticket";
import { SouvenirTicketType } from "./SouvenirTicketType";
import { type AttendeeField } from "@/server/database/enums/domain.enum";
import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Unique,
    type Relation,
} from "typeorm";

@Entity({ name: "ticket_types", schema: "public" })
@Unique("uq_ticket_types_event", ["id", "eventId"])
@Check("chk_ticket_types_stock", `"sold" >= 0 AND "quota" >= "sold"`)
@Check("chk_ticket_types_order_limits", `"minTicketQTY" >= 1 AND "maxTicketQTY" >= "minTicketQTY"`)
@Check("chk_ticket_types_price", `"price" >= 0`)
@Check("chk_ticket_types_token_reward", `"token_reward" BETWEEN 0 AND 99999999`)
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

    @Column({ name: "token_reward", type: "int", default: 0 })
    tokenReward!: number;

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

    @OneToMany(() => SouvenirTicketType, (link) => link.ticketType)
    souvenirLinks!: Relation<SouvenirTicketType[]>;

    @Column({ name: "required_fields", type: "varchar", array: true, default: [] })
    requiredFields!: AttendeeField[];

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
