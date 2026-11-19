import { Events } from "@/server/database/entities/Event";
import { OrderShipping } from "@/server/database/entities/OrderShipping";
import { Ticket } from "@/server/database/entities/Ticket";
import { User } from "@/server/database/entities/User";
import type { OrderSouvenirItem } from "@/lib/api-types";
import { DELIVERY_METHODS, type DeliveryMethod, ORDER_STATUSES, type OrderStatus } from "@/server/database/enums/domain.enum";
import {
    Check,
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
    Unique,
    type Relation,
} from "typeorm";

@Index("uq_orders_order_no", ["orderNo"], { unique: true })
@Unique("uq_orders_event_buyer", ["id", "eventId", "userId"])
@Check("chk_orders_total", `"shippingFee" >= 0 AND "total" >= "shippingFee"`)
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

    @Column({ name: "review_decision", type: "varchar", length: 10, nullable: true })
    reviewDecision!: "APPROVE" | "REJECT" | null;

    @Column({ name: "reviewed_by_id", type: "uuid", nullable: true })
    reviewedById!: string | null;

    @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "reviewed_by_id", foreignKeyConstraintName: "fk_orders_reviewer" })
    reviewedBy!: Relation<User> | null;

    @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
    reviewedAt!: Date | null;

    @Column({ name: "review_reason", type: "varchar", length: 500, nullable: true })
    reviewReason!: string | null;

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

    @Column({ name: "souvenir_items", type: "jsonb", default: [] })
    souvenirItems!: OrderSouvenirItem[];

    @OneToOne(() => OrderShipping, (s) => s.order)
    shipping!: Relation<OrderShipping> | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}
