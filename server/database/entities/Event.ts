import { EventSession } from "@/server/database/entities/EventSession";
import { EventTicket } from "@/server/database/entities/EventTicket";
import { Order } from "@/server/database/entities/Order";
import { Store } from "@/server/database/entities/Store";
import { UserRole } from "@/server/database/entities/UserRole";
import {
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

    @Column({ type: "boolean", default: false })
    hasSouvenir!: boolean;

    @Column({ type: "varchar", length: 255, nullable: true })
    souvenirName!: string | null;

    @Column({ type: "text", nullable: true })
    souvenirImage!: string | null;

    @Column({ type: "varchar", array: true, default: [] })
    souvenirSizes!: string[];

    @Column({ name: "souvenir_price", type: "decimal", precision: 10, scale: 2, nullable: true })
    souvenirPrice!: string | null;

    @Column({ type: "boolean", default: true })
    souvenirAllowDecline!: boolean;

    @Column({ name: "allow_shipping", type: "boolean", default: false })
    allowShipping!: boolean;

    @Column({ name: "shipping_fee", type: "decimal", precision: 10, scale: 2, default: 0 })
    shippingFee!: string;

    @OneToMany(() => EventTicket, (et) => et.event)
    tickets!: Relation<EventTicket[]>;

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
