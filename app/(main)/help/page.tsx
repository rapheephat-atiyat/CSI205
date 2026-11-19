import HelpClient from "@/app/(main)/help/HelpClient";
import { type Metadata } from "next";

export const metadata: Metadata = {
    title: "ศูนย์ช่วยเหลือ - TUATUA",
    description: "คำตอบเกี่ยวกับการจองบัตร การชำระเงิน การเข้างาน และบัญชี TUATUA",
}

export default function page() {
    return (
        <HelpClient />
    );
}