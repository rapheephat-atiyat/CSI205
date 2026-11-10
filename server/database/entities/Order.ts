import { Events } from "@/server/database/entities/Event";
import { OrderShipping } from "@/server/database/entities/OrderShipping";
import { Ticket } from "@/server/database/entities/Ticket";
import { User } from "@/server/database/entities/User";
import { DELIVERY_METHODS, type DeliveryMethod, ORDER_STATUSES, type OrderStatus } from "@/server/database/enums/domain.enum";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";

@Index("uq_orders_order_no", ["orderNo"], { unique: true })
@Entity({ name: "orders", schema: "public" })
export class Order {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "order_no", type: "varchar", length: 50 })
    orderNo!: string;

    @Column({ name: "user_id", type: "uuid" })
    userId!: string;

    @ManyToOne(() => User, (u) => u.orders, { onDelete: "RESTRICT", nullable: false })
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
    user!: Relation<User>;

    @Column({ name: "event_id", type: "uuid" })
    eventId!: string;

    @ManyToOne(() => Events, (e) => e.orders, { onDelete: "RESTRICT", nullable: false })
    @JoinColumn({ name: "event_id", referencedColumnName: "id" })
    event!: Relation<Events>;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    total!: string;

    @Column({
        type: "enum",
        enum: Object.values(ORDER_STATUSES),
        enumName: "order_status",
        default: ORDER_STATUSES.PENDING,
    })
    status!: OrderStatus;

    @Column({ type: "text", nullable: true })
    paymentSlip!: string | null;

    @Column({ type: "timestamptz", nullable: true })
    paidAt!: Date | null;

    @OneToMany(() => Ticket, (ticket) => ticket.order)
    tickets!: Relation<Ticket[]>;

    @Column({
        type: "enum",
        enum: Object.values(DELIVERY_METHODS),
        enumName: "delivery_method",
        default: DELIVERY_METHODS.NONE,
    })
    deliveryMethod!: DeliveryMethod;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    shippingFee!: string;

    @OneToOne(() => OrderShipping, (s) => s.order)
    shipping!: Relation<OrderShipping> | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
