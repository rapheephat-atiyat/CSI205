import "server-only";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { getDatabase } from "@/server/database/database.souce";
import { FaqCategory } from "@/server/database/entities/FaqCategory";
import { FaqCategoryInput, FaqCategoryItem, FaqQuestionInput, FaqQuestionItem } from "@/lib/api-types";
import { ApiError } from "@/server/http/errors";
import { FaqQuestion } from "@/server/database/entities/FaqQuestion";

function invalid(message: string): never {
    throw new ApiError("VALIDATION_ERROR", message, 422);
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

function toAdminQuestion(question: FaqQuestion) {
    return {
        ...toQuestionItem(question),
        categoryId: question.categoryId,
        sortOrder: question.sortOrder,
        isPublished: question.isPublished,
        createdAt: question.createdAt.toISOString(),
        updatedAt: question.updatedAt.toISOString(),
    };
}

function toAdminCategory(category: FaqCategory) {
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

export async function getAdminFaq() {
    const categories = await findFaq(false);
    return categories.map(toAdminCategory);
}

export async function createFaqCategory(input: FaqCategoryInput) {
    const name = readText(input.name, "ชื่อหมวด", 255);
    const icon = readText(input.icon, "ชื่อไอคอน", 255);
    const options = readOptions(input);

    if (!Object.hasOwn(dynamicIconImports, icon)) {
        invalid("ไม่พบไอคอนที่เลือกใน Lucide");
    }

    const db = await getDatabase();
    const repo = db.getRepository(FaqCategory);

    const category = repo.create({
        name,
        icon,
        ...options,
    });

    const savedCategory = await repo.save(category);
    return toAdminCategory(savedCategory);
}

export async function createFaqQuestion(input: FaqQuestionInput) {
    const categoryId = readText(input.categoryId, "รหัสหมวด");
    const question = readText(input.question, "คำถาม", 500);
    const answer = readText(input.answer, "คำตอบ");
    const options = readOptions(input);

    const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(categoryId)) {
        invalid("รูปแบบรหัสหมวดไม่ถูกต้อง");
    }

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

    const db = await getDatabase();

    const categoryExists = await db.getRepository(FaqCategory)
        .existsBy({ id: categoryId });

    if (!categoryExists) {
        throw new ApiError(
            "FAQ_CATEGORY_NOT_FOUND",
            "ไม่พบหมวดคำถาม",
            404,
        );
    }

    const repo = db.getRepository(FaqQuestion);

    const item = repo.create({
        categoryId,
        question,
        answer,
        keywords: [
            ...new Set(keywords.map((word) => word.trim()).filter(Boolean)),
        ],
        linkLabel,
        linkHref,
        ...options,
    });

    const savedQuestion = await repo.save(item);
    return toAdminQuestion(savedQuestion);
}