"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/lib/api-types";

export function apiData<T>(response: ApiResponse<T>): T {
    if (!response.success) throw new Error(response.error.message);
    return response.data;
}

export function AdminFeedback({ loading, error, retry }: { loading: boolean; error: string | null; retry: () => void }) {
    useEffect(() => { if (error) toast.error(error); }, [error]);
    if (loading) return <div role="status" aria-label="กำลังโหลดข้อมูล" className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-60 w-full" /></div>;
    if (error) return <div role="alert" className="rounded-xl border bg-background p-6 text-center"><p>{error}</p><Button variant="outline" className="mt-4 min-h-11" onClick={retry}>ลองใหม่</Button></div>;
    return null;
}
