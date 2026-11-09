import { Order } from "@/server/database/entities/Order";
import { SHIPPING_STATUSES, type ShippingStatus } from "@/server/database/enums/domain.enum";
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    type Relation,
} from "typeorm";

@Entity({ name: "order_shipments", schema: "public" })
@Index("uq_order_shipments_order_id", ["orderId"], { unique: true })
export class OrderShipping {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "order_id", type: "uuid" })
    orderId!: string;

    @OneToOne(() => Order, (o) => o.shipping, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "order_id", referencedColumnName: "id" })
    order!: Relation<Order>;

    @Column({ name: "recipient_name", type: "varchar", length: 255 })
    recipientName!: string;

    @Column({ name: "recipient_phone", type: "varchar", length: 20 })
    recipientPhone!: string;

    @Column({ name: "address_line", type: "text" })
    addressLine!: string;

    @Column({ name: "sub_district", type: "varchar", length: 100 })
    subDistrict!: string;

    @Column({ type: "varchar", length: 100 })
    district!: string;

    @Column({ type: "varchar", length: 100 })
    province!: string;

    @Column({ name: "postal_code", type: "varchar", length: 10 })
    postalCode!: string;

    @Column({ type: "text", nullable: true })
    note!: string | null;

    @Column({
        type: "enum",
        enum: Object.values(SHIPPING_STATUSES),
        enumName: "shipping_status",
        default: SHIPPING_STATUSES.PENDING,
    })
    status!: ShippingStatus;

    @Column({ type: "varchar", length: 100, nullable: true })
    carrier!: string | null;

    @Column({ name: "tracking_number", type: "varchar", length: 100, nullable: true })
    trackingNumber!: string | null;

    @Column({ name: "shipped_at", type: "timestamptz", nullable: true })
    shippedAt!: Date | null;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}