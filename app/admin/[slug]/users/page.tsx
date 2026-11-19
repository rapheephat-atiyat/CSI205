"use client";

import { useEffect, useState } from "react";
import type { AdminUser, UserRoleAssignment } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { AdminFeedback, apiData } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RoleDialog from "./RoleDialog";

const roleLabels: Record<string, string> = { ADMIN: "ผู้ดูแลงาน", STAFF: "เจ้าหน้าที่", VENDOR: "ผู้ดูแลร้าน" };

export default function UsersPage() {
    const { eventId, eventTitle, userId } = useAdminAccess();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [query, setQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [revision, setRevision] = useState(0);
    const [target, setTarget] = useState<{ user: AdminUser; role?: UserRoleAssignment } | null>(null);
    function reload() { setLoading(true); setRevision((value) => value + 1); }
    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
            api.admin.eventUsers.list(eventId, query).then(apiData).then((data) => { if (!cancelled) { setUsers(data); setError(null); } })
                .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "โหลดผู้ใช้ไม่สำเร็จ"); })
                .finally(() => { if (!cancelled) setLoading(false); });
        }, 200);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [eventId, query, revision]);
    return <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">ผู้ใช้และสิทธิ์</h1><p className="mt-2 text-sm text-muted-foreground">{eventTitle} · มอบหมายบทบาทเฉพาะงานนี้</p></div><Button variant="outline" className="min-h-11" onClick={reload}>รีเฟรชข้อมูล</Button></header>
        <div className="space-y-2"><label htmlFor="users-search" className="text-sm font-medium">ค้นหาบัญชี</label><Input id="users-search" maxLength={100} value={query} placeholder="ค้นหาชื่อหรืออีเมลเพื่อเพิ่มทีมงาน" onChange={(event) => { setQuery(event.target.value); setLoading(true); }} /><p className="text-xs text-muted-foreground">แสดงสูงสุด 200 บัญชี ใช้คำค้นเพื่อค้นหาคนที่ต้องการ</p></div>
        <AdminFeedback loading={loading} error={error} retry={reload} />
        {!loading && !error && <div className="rounded-xl border bg-background p-4"><Table><TableHeader><TableRow><TableHead>ผู้ใช้</TableHead><TableHead>สถานะ</TableHead><TableHead>บทบาทในงานนี้</TableHead><TableHead>จัดการ</TableHead></TableRow></TableHeader><TableBody>{users.length ? users.map((user) => <TableRow key={user.id}>
            <TableCell><p className="font-medium">{user.name}</p><p className="mt-1 text-sm text-muted-foreground">{user.email}</p></TableCell><TableCell>{user.status === "ACTIVE" ? "ใช้งานได้" : "ถูกระงับ"}</TableCell>
            <TableCell><div className="flex max-w-lg flex-wrap gap-2">{user.roles.length ? user.roles.map((role) => <Button key={role.id} variant="outline" className="min-h-11" disabled={user.id === userId} onClick={() => setTarget({ user, role })}>{roleLabels[role.role] || role.role} · แก้ไข</Button>) : <span className="text-muted-foreground">ยังไม่มีบทบาท</span>}</div></TableCell>
            <TableCell><Button variant="outline" className="min-h-11" disabled={user.status !== "ACTIVE"} onClick={() => setTarget({ user })}>เพิ่มบทบาท</Button></TableCell>
        </TableRow>) : <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">ไม่พบบัญชีที่ตรงกัน</TableCell></TableRow>}</TableBody></Table></div>}
        <RoleDialog target={target} onClose={() => setTarget(null)} onSaved={() => { setTarget(null); reload(); }} />
    </div>;
}
