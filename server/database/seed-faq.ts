import type { EntityManager } from "typeorm";
import type { FaqCategoryInput, FaqQuestionInput } from "@/lib/api-types";
import { FaqCategory } from "./entities/FaqCategory";
import { FaqQuestion } from "./entities/FaqQuestion";

type SeedCategory = Pick<FaqCategoryInput, "name" | "icon"> & {
    questions: Omit<FaqQuestionInput, "categoryId" | "sortOrder" | "isPublished">[];
};

export const FAQ_SEED_DATA: SeedCategory[] = [
    {
        name: "การจองบัตร", icon: "ticket",
        questions: [
            { question: "เริ่มจองบัตรได้อย่างไร?", answer: "เลือกงานที่สนใจจากหน้างานทั้งหมด แล้วอ่านวัน เวลา สถานที่ และเงื่อนไขของงาน\nเข้าสู่ระบบ เลือกประเภทและจำนวนบัตร กรอกข้อมูลผู้เข้าร่วม แล้วตรวจสอบรายละเอียดก่อนยืนยันคำสั่งซื้อ", keywords: ["ซื้อบัตร", "จอง", "ตั๋ว"], linkLabel: "เลือกงานที่สนใจ", linkHref: "/events" },
            { question: "จองบัตรหลายใบในครั้งเดียวได้ไหม?", answer: "เลือกจำนวนบัตรที่ต้องการในขั้นตอนจอง โดยจำนวนที่จองได้ขึ้นอยู่กับประเภทบัตรและจำนวนคงเหลือ\nหากจองให้หลายคน กรุณาตรวจสอบข้อมูลผู้เข้าร่วมของบัตรแต่ละใบให้ครบก่อนยืนยัน", keywords: ["กลุ่มเพื่อน", "หลายคน", "จำนวนบัตร"] },
            { question: "ซื้อบัตรแล้ว ดูบัตรของฉันได้ที่ไหน?", answer: "เข้าสู่ระบบด้วยบัญชีที่ใช้จอง แล้วเปิดหน้าบัตรของฉัน\nเมื่อคำสั่งซื้อได้รับการยืนยันชำระเงินแล้ว คุณจะเห็นบัตรพร้อม QR Code สำหรับเช็กอิน หากยังไม่เห็นบัตร ให้ตรวจสอบสถานะคำสั่งซื้อก่อน", keywords: ["QR", "หาบัตร", "บัตรหาย"], linkLabel: "ดูบัตรของฉัน", linkHref: "/account/tickets" },
        ],
    },
    {
        name: "การชำระเงิน", icon: "credit-card",
        questions: [
            { question: "ตรวจสอบวิธีชำระเงินและยอดที่ต้องจ่ายได้ที่ไหน?", answer: "เปิดคำสั่งซื้อที่ต้องการจากหน้าคำสั่งซื้อของฉัน ตรวจสอบยอดรวมและทำตามวิธีชำระเงินที่แสดงในรายการนั้น\nตรวจสอบข้อมูลและยอดให้ตรงกับคำสั่งซื้อก่อนชำระทุกครั้ง", keywords: ["โอน", "จ่ายเงิน", "ยอดรวม"], linkLabel: "ดูคำสั่งซื้อของฉัน", linkHref: "/account/orders" },
            { question: "ส่งสลิปแล้ว ทำไมยังขึ้นว่ารอตรวจสอบ?", answer: "การส่งสลิปเป็นการส่งหลักฐานให้ผู้จัดงานตรวจสอบ สถานะจึงอาจยังไม่เปลี่ยนเป็นชำระแล้วทันที\nติดตามผลได้ในหน้าคำสั่งซื้อของฉัน และตรวจสอบว่าหลักฐานที่ส่งเป็นของรายการและยอดที่ถูกต้อง", keywords: ["หลักฐาน", "สลิป", "รออนุมัติ"], linkLabel: "ติดตามสถานะคำสั่งซื้อ", linkHref: "/account/orders" },
            { question: "ยังไม่ได้ชำระเงิน จะกลับมาทำรายการต่อได้อย่างไร?", answer: "เปิดหน้าคำสั่งซื้อของฉัน แล้วเลือกรายการที่ต้องการชำระต่อ\nหากรายการหมดอายุหรือถูกยกเลิกแล้ว ให้ตรวจสอบว่างานยังเปิดขายและมีบัตรคงเหลือก่อนสร้างคำสั่งซื้อใหม่", keywords: ["ค้างชำระ", "หมดอายุ", "ชำระภายหลัง"], linkLabel: "เปิดคำสั่งซื้อของฉัน", linkHref: "/account/orders" },
        ],
    },
    {
        name: "การเข้างาน", icon: "scan-line",
        questions: [
            { question: "ต้องเตรียมอะไรไปเข้างาน?", answer: "เตรียม QR Code จากหน้าบัตรของฉัน พร้อมเอกสารตามเงื่อนไขที่ผู้จัดงานระบุ\nตรวจสอบวัน เวลา สถานที่ และรอบของบัตรก่อนออกเดินทาง เพื่อให้เจ้าหน้าที่ตรวจสอบได้สะดวก", keywords: ["เช็กอิน", "check-in", "เอกสาร"], linkLabel: "เตรียมบัตรเข้างาน", linkHref: "/account/tickets" },
            { question: "QR Code ของบัตรแต่ละใบใช้เหมือนกันไหม?", answer: "บัตรแต่ละใบมี QR Code ของตัวเอง หากจองหลายใบ ให้แยกบัตรตามข้อมูลผู้เข้าร่วมก่อนเข้าคิว\nหลีกเลี่ยงการเผยแพร่ QR Code ในที่สาธารณะ และตรวจสอบว่ากำลังเปิดบัตรของงานและรอบที่ถูกต้อง", keywords: ["สแกน", "คิวอาร์", "หลายใบ"] },
            { question: "หากสแกนบัตรไม่ได้ ควรทำอย่างไร?", answer: "เพิ่มความสว่างหน้าจอ เปิด QR Code ให้เห็นครบทั้งภาพ และตรวจสอบสถานะบัตรในหน้าบัตรของฉัน\nหากยังสแกนไม่ได้ ให้แจ้งเจ้าหน้าที่จุดเช็กอินพร้อมเลขบัตรหรือเลขคำสั่งซื้อ เพื่อช่วยตรวจสอบข้อมูล", keywords: ["สแกนไม่ผ่าน", "บัตรใช้แล้ว", "ประตู"], linkLabel: "ตรวจสอบบัตรของฉัน", linkHref: "/account/tickets" },
        ],
    },
    {
        name: "บัญชีและกระเป๋าเงิน", icon: "wallet",
        questions: [
            { question: "ข้อมูลคำสั่งซื้อและบัตรผูกกับบัญชีไหน?", answer: "คำสั่งซื้อและบัตรจะแสดงในบัญชีที่ใช้ทำรายการ หากไม่พบข้อมูล ให้ตรวจสอบว่าลงชื่อเข้าใช้ด้วยอีเมลเดียวกับตอนจอง\nคุณสามารถดูข้อมูลบัญชีที่กำลังใช้งานได้ในหน้าโปรไฟล์", keywords: ["อีเมล", "เข้าสู่ระบบ", "login"], linkLabel: "ตรวจสอบโปรไฟล์", linkHref: "/profile" },
            { question: "ตรวจสอบยอดโทเคนคงเหลือได้ที่ไหน?", answer: "เปิดหน้ากระเป๋าเงินในบัญชีของคุณ เพื่อดูยอดโทเคนคงเหลือและประวัติรายการ\nตรวจสอบบัญชีที่ใช้งานให้ถูกต้อง โดยเฉพาะเมื่อใช้อุปกรณ์ร่วมกับผู้อื่น", keywords: ["wallet", "balance", "ยอดเงิน"], linkLabel: "ดูกระเป๋าเงิน", linkHref: "/account/wallet" },
            { question: "ยอดโทเคนไม่ตรงกับที่คาดไว้ ควรตรวจสอบอะไร?", answer: "ตรวจสอบประวัติในหน้ากระเป๋าเงิน โดยดูประเภท จำนวน และสถานะของรายการล่าสุด\nหากต้องการให้เจ้าหน้าที่ช่วยตรวจสอบ ให้เตรียมเลขรายการหรือหลักฐานที่เกี่ยวข้องไว้ด้วย", keywords: ["เติมเงิน", "หักเงิน", "ประวัติ", "ยอดไม่ตรง"], linkLabel: "ตรวจสอบประวัติโทเคน", linkHref: "/account/wallet" },
        ],
    },
];

// เพิ่มเฉพาะรายการที่ยังไม่มี โดยรักษาข้อความและสถานะที่แอดมินแก้ไว้
export async function seedFaq(manager: EntityManager) {
    const categories = manager.getRepository(FaqCategory);
    const questions = manager.getRepository(FaqQuestion);
    let createdCategories = 0;
    let createdQuestions = 0;

    for (const [sortOrder, item] of FAQ_SEED_DATA.entries()) {
        let category = await categories.findOneBy({ name: item.name });
        if (!category) {
            category = await categories.save(categories.create({ name: item.name, icon: item.icon, sortOrder, isPublished: true }));
            createdCategories++;
        }
        for (const [questionOrder, question] of item.questions.entries()) {
            if (await questions.existsBy({ categoryId: category.id, question: question.question })) continue;
            await questions.save(questions.create({ ...question, categoryId: category.id, sortOrder: questionOrder, isPublished: true }));
            createdQuestions++;
        }
    }

    return { createdCategories, createdQuestions };
}
