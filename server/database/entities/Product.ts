import { Store } from "@/server/database/entities/Store";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from "typeorm";

@Entity({ name: "products", schema: "public" })
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToOne(() => Store, (s) => s.product, { onDelete: "CASCADE", nullable: false })
    @JoinColumn({ name: "store_id", referencedColumnName: "id" })
    store!: Relation<Store>

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price!: string;

    @Column({ type: "text", array: true, default: [] })
    images!: string[];

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