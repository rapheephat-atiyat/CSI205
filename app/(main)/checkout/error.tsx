"use client";

import { CheckoutPanel } from "@/components/checkout/checkout-ui";
import { Button } from "@/components/ui/button";

export default function CheckoutError({ reset }: { reset: () => void }) {
    return <main className="mx-auto w-full max-w-xl px-4 py-12"><CheckoutPanel title="โหลดข้อมูลคำสั่งซื้อไม่สำเร็จ">
        <p className="text-sm text-muted-foreground">กรุณาลองเปิดหน้านี้อีกครั้ง</p>
        <Button type="button" variant="brand" onClick={reset}>ลองอีกครั้ง</Button>
    </CheckoutPanel></main>;
}
