import { EventSession } from "@/server/database/entities/EventSession";
import { EventSouvenir } from "@/server/database/entities/EventSouvenir";
import { EventTicket } from "@/server/database/entities/EventTicket";
import { Order } from "@/server/database/entities/Order";
import { Store } from "@/server/database/entities/Store";
import { UserRole } from "@/server/database/entities/UserRole";
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

@Entity({ name: "events", schema: "public" })
@Index("uq_events_slug", ["slug"], { unique: true })
@Check("chk_events_sales_dates", `"buyAt" < "buyEndAt"`)
@Check("chk_events_ticket_limits", `"minTicketQTY" >= 1 AND "maxTicketQTY" >= "minTicketQTY"`)
@Check("chk_events_shipping_fee", `"shipping_fee" >= 0`)
export class Events {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "varchar", length: 255 })
    slug!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "varchar", length: 255 })
    subTitle!: string;

    @Column({ type: "text" })
    banner!: string;

    @Column({ type: "text" })
    thumbnail!: string;

    @Column({ type: "varchar", length: 255 })
    venue!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "varchar", array: true, default: [] })
    tags!: string[];

    @Column({ name: "allow_shipping", type: "boolean", default: false })
    allowShipping!: boolean;

    @Column({ name: "shipping_fee", type: "decimal", precision: 10, scale: 2, default: 0 })
    shippingFee!: string;

    @OneToMany(() => EventTicket, (et) => et.event)
    tickets!: Relation<EventTicket[]>;

    @OneToMany(() => EventSouvenir, (souvenir) => souvenir.event)
    souvenirs!: Relation<EventSouvenir[]>;

    @OneToMany(() => EventSession, (es) => es.event)
    sessions!: Relation<EventSession[]>;

    @OneToMany(() => Store, (store) => store.event)
    stores!: Relation<Store[]>;

    @OneToMany(() => Order, (o) => o.event)
    orders!: Relation<Order[]>;

    @OneToMany(() => UserRole, (userRole) => userRole.event)
    userRoles!: Relation<UserRole[]>;

    @Column({ type: "timestamptz" })
    buyAt!: Date;

    @Column({ type: "timestamptz" })
    buyEndAt!: Date;

    @Column({ name: "archived_at", type: "timestamptz", nullable: true })
    archivedAt!: Date | null;

    @Column({ type: "int", default: 1 })
    minTicketQTY!: number;

    @Column({ type: "int", default: 1 })
    maxTicketQTY!: number;

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
