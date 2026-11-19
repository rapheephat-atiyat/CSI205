import { Events } from "./Event";
import { SouvenirTicketType } from "./SouvenirTicketType";
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, type Relation } from "typeorm";

@Entity({ name: "event_souvenirs", schema: "public" })
@Unique("uq_event_souvenirs_event", ["id", "eventId"])
@Check("chk_event_souvenirs_extra_price", `"extra_price" >= 0`)
export class EventSouvenir {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index("idx_event_souvenirs_event")
    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => Events, (event) => event.souvenirs, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "event_id", foreignKeyConstraintName: "fk_event_souvenirs_event" })
    event!: Relation<Events>;

    @Column({ type: "varchar", length: 255 })
    name!: string;

    @Column({ type: "text", nullable: true })
    image!: string | null;

    @Column({ type: "varchar", array: true, default: [] })
    sizes!: string[];

    @Column({ name: "extra_price", type: "decimal", precision: 10, scale: 2, nullable: true })
    extraPrice!: string | null;

    @Column({ name: "allow_decline", type: "boolean", default: true })
    allowDecline!: boolean;

    @Column({ name: "all_ticket_types", type: "boolean", default: false })
    allTicketTypes!: boolean;

    @OneToMany(() => SouvenirTicketType, (link) => link.souvenir)
    ticketTypeLinks!: Relation<SouvenirTicketType[]>;
}
