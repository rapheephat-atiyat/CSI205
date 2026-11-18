"use client";

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, ReceiptText, Ticket, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES: Record<string, string> = {
    "/account": "โปรไฟล์ของฉัน",
    "/account/tickets": "บัตรของฉัน",
    "/account/wallet": "กระเป๋าเงิน",
    "/account/orders": "ประวัติคำสั่งซื้อ",
}

const accountLinks = [
    { href: "/profile", label: "โปรไฟล์ของฉัน", icon: User, exact: false },
    { href: "/account/orders", label: "ประวัติคำสั่งซื้อ", icon: ReceiptText, exact: false },
    { href: "/account/tickets", label: "บัตรของฉัน", icon: Ticket, exact: false },
    { href: "/account/wallet", label: "กระเป๋าเงิน", icon: Wallet, exact: false },
];

export function AccountLinks() {
    const pathname = usePathname();
    return (
        <nav aria-label="เมนูบัญชี" className="flex flex-wrap gap-1 rounded-xl border bg-card p-2 lg:flex-col">
            {accountLinks.map(({ href, label, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href);
                return (
                    <Link key={href} href={href} aria-current={isActive ? "page" : undefined}
                        className={cn("inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm focus-visible:ring-2 focus-visible:ring-brand", isActive ? "bg-brand-soft font-medium text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                        <Icon className="size-4 shrink-0" aria-hidden="true" />{label}
                    </Link>
                );
            })}
        </nav>
    );
}

export default function AccBreadCrumb() {
    const pathname = usePathname();
    const current = PAGES[pathname] ?? "จัดการบัญชี";
    const isAccountRoot = pathname === "/account";

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
                {isAccountRoot ? (
                    <BreadcrumbItem>
                        <BreadcrumbPage>โปรไฟล์ของฉัน</BreadcrumbPage>
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
