"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ContentLoadError({ message }: { message: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const id = toast.error(message);
        return () => { toast.dismiss(id); };
    }, [message]);

    return (
        <div role="status" className="rounded-xl border border-border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button variant="outline" disabled={isPending} onClick={() => startTransition(() => router.refresh())} className="mt-4 min-h-11 px-5">
                {isPending ? "กำลังโหลด..." : "ลองใหม่"}
            </Button>
        </div>
    );
}
