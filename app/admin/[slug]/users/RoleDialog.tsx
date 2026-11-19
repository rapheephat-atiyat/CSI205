"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminStore, AdminUser, UserRoleAssignment, UserRoleName } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { EVENT_ADMIN_PERMISSIONS, PERMISSION_LABELS, PERMISSIONS, type Permission } from "@/lib/permissions";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { apiData } from "@/components/admin/AdminFeedback";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Target = { user: AdminUser; role?: UserRoleAssignment };
const labels = { ADMIN: "ผู้ดูแลงาน", STAFF: "เจ้าหน้าที่สแกนบัตร", VENDOR: "ผู้ดูแลร้านค้า" };
const allowed = (role: string): Permission[] => role === "ADMIN" ? EVENT_ADMIN_PERMISSIONS : role === "VENDOR" ? [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL] : [PERMISSIONS.TICKET_SCAN];

export default function RoleDialog({ target, onClose, onSaved }: { target: Target | null; onClose: () => void; onSaved: () => void }) {
    return <Dialog open={target !== null} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{target?.role ? "แก้ไขบทบาท" : "เพิ่มบทบาท"}</DialogTitle><DialogDescription>{target?.user.name} · สิทธิ์จะใช้ได้เฉพาะงานนี้</DialogDescription></DialogHeader>{target && <RoleForm key={`${target.user.id}-${target.role?.id ?? "new"}`} target={target} onSaved={onSaved} />}</DialogContent></Dialog>;
}

function RoleForm({ target, onSaved }: { target: Target; onSaved: () => void }) {
    const { eventId, can } = useAdminAccess();
    const [role, setRole] = useState<UserRoleName>(target.role?.role ?? "STAFF");
    const [permissions, setPermissions] = useState<Permission[]>(target.role?.permissions ?? [PERMISSIONS.TICKET_SCAN]);
    const [storeId, setStoreId] = useState(target.role?.storeId ?? "");
    const [stores, setStores] = useState<AdminStore[]>([]);
    const [busy, setBusy] = useState(false);
    const [confirmRevoke, setConfirmRevoke] = useState(false);
    useEffect(() => {
        if (role !== "VENDOR") return;
        let cancelled = false;
        api.admin.stores.list(eventId).then(apiData).then((data) => { if (!cancelled) setStores(data); }).catch((cause: unknown) => { if (!cancelled) toast.error(cause instanceof Error ? cause.message : "โหลดร้านค้าไม่สำเร็จ"); });
        return () => { cancelled = true; };
    }, [eventId, role]);
    async function save(event: React.FormEvent) {
        event.preventDefault(); setBusy(true);
        try {
            apiData(await (target.role ? api.admin.eventUsers.updateRole(eventId, target.user.id, target.role.id, permissions) : api.admin.eventUsers.assignRole(eventId, target.user.id, { role, permissions, storeId: role === "VENDOR" ? storeId : undefined })));
            toast.success("บันทึกบทบาทแล้ว"); onSaved();
        } catch (cause) { toast.error(cause instanceof Error ? cause.message : "บันทึกบทบาทไม่สำเร็จ"); }
        finally { setBusy(false); }
    }
    async function revoke() {
        if (!target.role || !confirmRevoke) return;
        setBusy(true);
        try { apiData(await api.admin.eventUsers.revokeRole(eventId, target.user.id, target.role.id)); toast.success("ถอนบทบาทแล้ว"); onSaved(); }
        catch (cause) { toast.error(cause instanceof Error ? cause.message : "ถอนบทบาทไม่สำเร็จ"); }
        finally { setBusy(false); }
    }
    return <form onSubmit={save} className="space-y-4"><fieldset disabled={busy} className="space-y-4"><div className="space-y-2"><label htmlFor="role-name" className="text-sm font-medium">บทบาท</label><Select value={role} disabled={Boolean(target.role)} onValueChange={(value) => { if (value === "ADMIN" || value === "STAFF" || value === "VENDOR") { setRole(value); setPermissions(allowed(value).filter((permission) => value === "VENDOR" || can(permission))); } }}><SelectTrigger id="role-name" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(labels).filter(([key]) => key !== "VENDOR" || can(PERMISSIONS.STORE_MANAGE)).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
        {role === "VENDOR" && <div className="space-y-2"><label htmlFor="role-store" className="text-sm font-medium">ร้านค้า</label><Select value={storeId} disabled={Boolean(target.role)} onValueChange={setStoreId}><SelectTrigger id="role-store" className="w-full"><SelectValue placeholder="เลือกร้านค้า" /></SelectTrigger><SelectContent>{stores.map((store) => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}</SelectContent></Select></div>}
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">สิทธิ์ที่อนุญาต</legend>{allowed(role).map((permission) => <label key={permission} className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={permissions.includes(permission)} disabled={role !== "VENDOR" && !can(permission)} onCheckedChange={(checked) => setPermissions((old) => checked === true ? [...old, permission] : old.filter((value) => value !== permission))} />{PERMISSION_LABELS[permission]}</label>)}</fieldset>
        <Button type="submit" disabled={busy || (role === "VENDOR" && !storeId)} className="min-h-11 bg-brand text-on-brand hover:bg-brand-hover">{busy ? "กำลังบันทึก..." : "บันทึกบทบาท"}</Button>
        {target.role && <div className="space-y-2 border-t pt-4"><label className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={confirmRevoke} onCheckedChange={(checked) => setConfirmRevoke(checked === true)} />ยืนยันถอนบทบาทนี้</label><Button type="button" variant="destructive" disabled={busy || !confirmRevoke} onClick={revoke}>ถอนบทบาท</Button></div>}
    </fieldset></form>;
}
