"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES: Record<string, string> = {
    "/account": "โปรไฟล์ของฉัน",
    "/account/tickets": "บัตรของฉัน",
    "/account/wallet": "กระเป๋าเงิน",
    "/account/orders": "ประวัติคำสั่งซื้อ",
}

export default function AccBreadCrumb() {
    const pathname = usePathname();
    const current = PAGES[pathname] ?? "จัดการบัญชี";

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/" className="flex items-center gap-1">
                            <ArrowLeft aria-hidden="true" className="size-4" /> หน้าหลัก
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {pathname === "/account" ? (
                    <BreadcrumbItem>
                        <BreadcrumbPage>บัญชี</BreadcrumbPage>
                    </BreadcrumbItem>
                ) : (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/account">บัญชี</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{current}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}