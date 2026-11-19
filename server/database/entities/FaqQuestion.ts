import { FaqCategory } from "@/server/database/entities/FaqCategory";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm";

@Entity({ name: "faq_questions", schema: "public" })
@Index("idx_faq_questions_category_order", ["categoryId", "sortOrder"])
export class FaqQuestion {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "category_id", type: "uuid" })
    categoryId!: string;

    @ManyToOne(() => FaqCategory, (category) => category.questions, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "category_id" })
    category!: Relation<FaqCategory>;

    @Column({ type: "varchar", length: 500 })
    question!: string;

    @Column({ type: "text" })
    answer!: string;

    @Column({ type: "text", array: true, default: [] })
    keywords!: string[];

    @Column({ type: "varchar", length: 150, nullable: true })
    linkLabel!: string | null;

    @Column({ type: "text", nullable: true })
    linkHref!: string | null;

    @Column({ type: "integer", default: 0 })
    sortOrder!: number;

    @Column({ type: "boolean", default: false })
    isPublished!: boolean;

    @CreateDateColumn({ name: "created_at", type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
    updatedAt!: Date;
}