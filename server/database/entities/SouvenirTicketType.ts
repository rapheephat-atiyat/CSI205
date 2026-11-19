import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from "typeorm";
import { EventSouvenir } from "./EventSouvenir";
import { EventTicket } from "./EventTicket";

@Entity({ name: "souvenir_ticket_types", schema: "public" })
@Index("idx_souvenir_ticket_types_ticket", ["ticketTypeId"])
export class SouvenirTicketType {
    @PrimaryColumn({ name: "souvenir_id", type: "uuid" })
    souvenirId!: string;

    @PrimaryColumn({ name: "ticket_type_id", type: "uuid" })
    ticketTypeId!: string;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => EventSouvenir, (souvenir) => souvenir.ticketTypeLinks, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn([
        { name: "souvenir_id", referencedColumnName: "id", foreignKeyConstraintName: "fk_souvenir_ticket_types_souvenir" },
        { name: "event_id", referencedColumnName: "eventId" },
    ])
    souvenir!: Relation<EventSouvenir>;

    @ManyToOne(() => EventTicket, (ticketType) => ticketType.souvenirLinks, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn([
        { name: "ticket_type_id", referencedColumnName: "id", foreignKeyConstraintName: "fk_souvenir_ticket_types_ticket" },
        { name: "event_id", referencedColumnName: "eventId" },
    ])
    ticketType!: Relation<EventTicket>;
}
