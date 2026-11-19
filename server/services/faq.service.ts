import "server-only";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { getDatabase } from "@/server/database/database.souce";
import { FaqCategory } from "@/server/database/entities/FaqCategory";
import type { FaqCategoryAdminItem, FaqCategoryInput, FaqCategoryItem, FaqQuestionAdminItem, FaqQuestionInput, FaqQuestionItem, UpdateFaqCategoryInput, UpdateFaqQuestionInput } from "@/lib/api-types";
import { ApiError } from "@/server/http/errors";
import { FaqQuestion } from "@/server/database/entities/FaqQuestion";
import type { EntityManager } from "typeorm";

function invalid(message: string): never {
    throw new ApiError("VALIDATION_ERROR", message, 422);
}

function readId(value: unknown): string {
    if (typeof value !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
        invalid("รูปแบบรหัสไม่ถูกต้อง");
    }
    return value;
}

function requireChanges(input: object, fields: readonly string[]) {
    if (!fields.some((field) => Object.hasOwn(input, field))) {
        invalid("ไม่มีข้อมูลที่ต้องแก้ไข");
    }
}

const categoryNotFound = () => new ApiError("FAQ_CATEGORY_NOT_FOUND", "ไม่พบหมวดคำถาม", 404);
const questionNotFound = () => new ApiError("FAQ_QUESTION_NOT_FOUND", "ไม่พบคำถาม", 404);

async function requireCategory(manager: EntityManager, id: string) {
    const category = await manager.findOne(FaqCategory, {
        where: { id },
        lock: { mode: "pessimistic_read" },
    });
    if (!category) throw categoryNotFound();
}

function readText(value: unknown, label: string, maxLength?: number): string {
    if (typeof value !== "string" || !value.trim()) {
        invalid(`กรุณาระบุ${label}`);
    }

    const text = value.trim();

    if (maxLength !== undefined && text.length > maxLength) {
        invalid(`${label}ต้องไม่เกิน ${maxLength} ตัวอักษร`);
    }

    return text;
}

function readNullableText(value: unknown, label: string, maxLength?: number): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== "string") invalid(`${label}ต้องเป็นข้อความ`);
    if (!value.trim()) return null;

    return readText(value, label, maxLength);
}


function readOptions(input: { sortOrder?: number; isPublished?: boolean; }) {
    const sortOrder = input.sortOrder === undefined ? 0 : input.sortOrder;
    const isPublished =
        input.isPublished === undefined ? false : input.isPublished;

    if (
        typeof sortOrder !== "number" ||
        !Number.isInteger(sortOrder) ||
        sortOrder < 0 ||
        sortOrder > 2147483647
    ) {
        invalid("ลำดับต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 2147483647");
    }

    if (typeof isPublished !== "boolean") {
        invalid("สถานะเผยแพร่ต้องเป็น true หรือ false");
    }

    return { sortOrder, isPublished };
}

function toQuestionItem(question: FaqQuestion): FaqQuestionItem {
    return {
        id: question.id,
        question: question.question,
        answer: question.answer,
        keywords: question.keywords,
        linkLabel: question.linkLabel,
        linkHref: question.linkHref,
    };
}

function toAdminQuestion(question: FaqQuestion): FaqQuestionAdminItem {
    return {
        ...toQuestionItem(question),
        categoryId: question.categoryId,
        sortOrder: question.sortOrder,
        isPublished: question.isPublished,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
    };
}

function toAdminCategory(category: FaqCategory): FaqCategoryAdminItem {
    return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isPublished: category.isPublished,
        questions: (category.questions ?? []).map(toAdminQuestion),
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
    };
}

async function findFaq(publishedOnly: boolean) {
    const db = await getDatabase();

    const query = db.getRepository(FaqCategory)
        .createQueryBuilder("category");

    if (publishedOnly) {
        query
            .leftJoinAndSelect(
                "category.questions",
                "question",
                "question.isPublished = :published",
                { published: true },
            )
            .where("category.isPublished = :published", {
                published: true,
            });
    } else {
        query.leftJoinAndSelect("category.questions", "question");
    }

    return query
        .orderBy("category.sortOrder", "ASC")
        .addOrderBy("category.id", "ASC")
        .addOrderBy("question.sortOrder", "ASC")
        .addOrderBy("question.id", "ASC")
        .getMany();
}


export async function getPublishedFaq(): Promise<FaqCategoryItem[]> {
    const categories = await findFaq(true);

    return categories.map((category) => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        questions: category.questions.map(toQuestionItem),
    }));
}

export async function getAdminFaq(): Promise<FaqCategoryAdminItem[]> {
    const categories = await findFaq(false);
    return categories.map(toAdminCategory);
}

function readCategoryFields(input: FaqCategoryInput) {
    const name = readText(input.name, "ชื่อหมวด", 255);
    const icon = readText(input.icon, "ชื่อไอคอน", 255);
    const options = readOptions(input);

    if (!Object.hasOwn(dynamicIconImports, icon)) {
        invalid("ไม่พบไอคอนที่เลือกใน Lucide");
    }

    return { name, icon, ...options };
}

function readQuestionFields(input: FaqQuestionInput) {
    const categoryId = readId(input.categoryId);
    const question = readText(input.question, "คำถาม", 500);
    const answer = readText(input.answer, "คำตอบ");
    const options = readOptions(input);

    const keywords = input.keywords === undefined ? [] : input.keywords;

    if (!Array.isArray(keywords) || keywords.some((keyword) => typeof keyword !== "string")) {
        invalid("คำค้นเพิ่มเติมต้องเป็นรายการข้อความ");
    }

    const linkLabel = readNullableText(
        input.linkLabel,
        "ข้อความลิงก์",
        150,
    );
    let linkHref = readNullableText(input.linkHref, "URL ลิงก์");

    if (Boolean(linkLabel) !== Boolean(linkHref)) {
        invalid("กรุณาระบุข้อความลิงก์และ URL ให้ครบทั้งคู่");
    }

    if (linkHref) {
        const isInternal =
            linkHref.startsWith("/") &&
            !linkHref.startsWith("//") &&
            !linkHref.includes("\\");

        if (!isInternal) {
            let url: URL;

            try {
                url = new URL(linkHref);
            } catch {
                invalid("URL ลิงก์ไม่ถูกต้อง");
            }

            if (!["http:", "https:"].includes(url.protocol)) {
                invalid("ลิงก์ต้องเป็นหน้าในเว็บ หรือใช้ HTTP/HTTPS");
            }

            linkHref = url.href;
        }
    }

    return {
        categoryId,
        question,
        answer,
        keywords: [
            ...new Set(keywords.map((word) => word.trim()).filter(Boolean)),
        ],
        linkLabel,
        linkHref,
        ...options,
    };
}

export async function getFaqCategory(id: string): Promise<FaqCategoryAdminItem> {
    readId(id);
    const db = await getDatabase();
    const category = await db.getRepository(FaqCategory).findOne({
        where: { id },
        relations: { questions: true },
        order: { questions: { sortOrder: "ASC", id: "ASC" } },
    });
    if (!category) throw categoryNotFound();
    return toAdminCategory(category);
}

export async function getFaqQuestion(id: string): Promise<FaqQuestionAdminItem> {
    readId(id);
    const db = await getDatabase();
    const question = await db.getRepository(FaqQuestion).findOneBy({ id });
    if (!question) throw questionNotFound();
    return toAdminQuestion(question);
}

export async function createFaqCategory(input: FaqCategoryInput): Promise<FaqCategoryAdminItem> {
    const fields = readCategoryFields(input);
    const db = await getDatabase();
    const repo = db.getRepository(FaqCategory);
    return toAdminCategory(await repo.save(repo.create(fields)));
}

export async function createFaqQuestion(input: FaqQuestionInput): Promise<FaqQuestionAdminItem> {
    const fields = readQuestionFields(input);
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        await requireCategory(manager, fields.categoryId);
        return toAdminQuestion(await manager.save(manager.create(FaqQuestion, fields)));
    });
}

export async function updateFaqCategory(id: string, input: UpdateFaqCategoryInput): Promise<FaqCategoryAdminItem> {
    readId(id);
    requireChanges(input, ["name", "icon", "sortOrder", "isPublished"]);
    const db = await getDatabase();
    await db.transaction(async (manager) => {
        const category = await manager.findOne(FaqCategory, { where: { id }, lock: { mode: "pessimistic_write" } });
        if (!category) throw categoryNotFound();
        const fields = readCategoryFields({
            name: input.name === undefined ? category.name : input.name,
            icon: input.icon === undefined ? category.icon : input.icon,
            sortOrder: input.sortOrder === undefined ? category.sortOrder : input.sortOrder,
            isPublished: input.isPublished === undefined ? category.isPublished : input.isPublished,
        });
        manager.merge(FaqCategory, category, fields);
        await manager.save(category);
    });
    return getFaqCategory(id);
}

export async function updateFaqQuestion(id: string, input: UpdateFaqQuestionInput): Promise<FaqQuestionAdminItem> {
    readId(id);
    requireChanges(input, ["categoryId", "question", "answer", "keywords", "linkLabel", "linkHref", "sortOrder", "isPublished"]);
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const question = await manager.findOne(FaqQuestion, { where: { id }, lock: { mode: "pessimistic_write" } });
        if (!question) throw questionNotFound();
        const fields = readQuestionFields({
            categoryId: input.categoryId === undefined ? question.categoryId : input.categoryId,
            question: input.question === undefined ? question.question : input.question,
            answer: input.answer === undefined ? question.answer : input.answer,
            keywords: input.keywords === undefined ? question.keywords : input.keywords,
            linkLabel: input.linkLabel === undefined ? question.linkLabel : input.linkLabel,
            linkHref: input.linkHref === undefined ? question.linkHref : input.linkHref,
            sortOrder: input.sortOrder === undefined ? question.sortOrder : input.sortOrder,
            isPublished: input.isPublished === undefined ? question.isPublished : input.isPublished,
        });
        await requireCategory(manager, fields.categoryId);
        manager.merge(FaqQuestion, question, fields);
        return toAdminQuestion(await manager.save(question));
    });
}

export async function deleteFaqQuestion(id: string): Promise<{ id: string }> {
    readId(id);
    const db = await getDatabase();
    const result = await db.getRepository(FaqQuestion).delete({ id });
    if (!result.affected) throw questionNotFound();
    return { id };
}

export async function deleteFaqCategory(id: string): Promise<{ id: string }> {
    readId(id);
    const db = await getDatabase();
    return db.transaction(async (manager) => {
        const category = await manager.findOne(FaqCategory, { where: { id }, lock: { mode: "pessimistic_write" } });
        if (!category) throw categoryNotFound();
        if (await manager.existsBy(FaqQuestion, { categoryId: id })) {
            throw new ApiError("FAQ_CATEGORY_HAS_QUESTIONS", "กรุณาย้ายหรือลบคำถามในหมวดนี้ก่อน", 409);
        }
        await manager.delete(FaqCategory, { id });
        return { id };
    });
}
