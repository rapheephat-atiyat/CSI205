"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminStore, AdminUser, UserRoleAssignment, UserRoleName } from "@/lib/api-types";
import { api } from "@/lib/api-client";
import { EVENT_ADMIN_PERMISSIONS, PERMISSIONS, type Permission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Target = { user: AdminUser; role?: UserRoleAssignment };

const roleOptions: { key: UserRoleName; label: string }[] = [
  { key: "STAFF", label: "เจ้าหน้าที่ (สแกนบัตร)" },
  { key: "VENDOR", label: "ผู้ดูแลร้านค้า (ขายสินค้า)" },
  { key: "ADMIN", label: "ผู้ดูแลงาน (จัดการข้อมูล)" },
];

// สิทธิ์ตั้งต้นตามแต่ละบทบาท
function getDefaultPermissions(role: UserRoleName): Permission[] {
  if (role === "ADMIN") {
    return EVENT_ADMIN_PERMISSIONS;
  }
  if (role === "VENDOR") {
    return [PERMISSIONS.STORE_MANAGE, PERMISSIONS.STORE_SELL];
  }
  return [PERMISSIONS.TICKET_SCAN];
}

export default function RoleDialog({
  eventId,
  target,
  onClose,
  onSaved,
}: {
  eventId: string;
  target: Target | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {target?.role ? "แก้ไขบทบาท" : "เพิ่มบทบาท"}
          </DialogTitle>
          <DialogDescription>
            {target?.user.name} ({target?.user.email}) · สิทธิ์จะใช้ได้เฉพาะงานนี้
          </DialogDescription>
        </DialogHeader>

        {target && (
          <RoleForm
            key={`${target.user.id}-${target.role?.id ?? "new"}`}
            eventId={eventId}
            target={target}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleForm({
  eventId,
  target,
  onSaved,
}: {
  eventId: string;
  target: Target;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<UserRoleName>(
    target.role?.role ?? "STAFF"
  );
  const [storeId, setStoreId] = useState(target.role?.storeId ?? "");
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // โหลดรายการร้านค้าเมื่อเลือกเป็นผู้ดูแลร้าน (VENDOR)
  useEffect(() => {
    async function loadStores() {
      if (role !== "VENDOR") return;
      const res = await api.admin.stores.list(eventId);
      if (res.success) {
        setStores(res.data);
      }
    }
    loadStores();
  }, [eventId, role]);

  // บันทึกบทบาท
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (role === "VENDOR" && !storeId) {
      toast.error("กรุณาเลือกร้านค้าที่ต้องการมอบหมาย");
      return;
    }

    setBusy(true);
    const permissions = getDefaultPermissions(role);

    try {
      if (target.role) {
        // แก้ไขบทบาทเดิม
        const res = await api.admin.eventUsers.updateRole(
          eventId,
          target.user.id,
          target.role.id,
          permissions
        );
        if (res.success) {
          toast.success("บันทึกบทบาทเรียบร้อยแล้ว");
          onSaved();
        } else {
          toast.error(res.error.message);
        }
      } else {
        // เพิ่มบทบาทใหม่
        const res = await api.admin.eventUsers.assignRole(
          eventId,
          target.user.id,
          {
            role,
            permissions,
            storeId: role === "VENDOR" ? storeId : undefined,
          }
        );
        if (res.success) {
          toast.success("มอบหมายบทบาทเรียบร้อยแล้ว");
          onSaved();
        } else {
          toast.error(res.error.message);
        }
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกบทบาท");
    } finally {
      setBusy(false);
    }
  }

  // ถอนบทบาท
  async function handleRevoke() {
    if (!target.role || !confirmRevoke) return;
    setBusy(true);

    try {
      const res = await api.admin.eventUsers.revokeRole(
        eventId,
        target.user.id,
        target.role.id
      );
      if (res.success) {
        toast.success("ถอนบทบาทเรียบร้อยแล้ว");
        onSaved();
      } else {
        toast.error(res.error.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการถอนบทบาท");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 pt-2">
      <fieldset disabled={busy} className="space-y-4">
        {/* เลือกรบทบาท */}
        <Field>
          <FieldLabel htmlFor="role-select" className="text-sm font-medium">
            เลือกบทบาท
          </FieldLabel>
          <Select
            value={role}
            disabled={Boolean(target.role)}
            onValueChange={(val) => setRole(val as UserRoleName)}
          >
            <SelectTrigger id="role-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* เลือกร้านค้า (เมื่อเป็น VENDOR) */}
        {role === "VENDOR" && (
          <Field>
            <FieldLabel htmlFor="store-select" className="text-sm font-medium">
              ร้านค้าที่ดูแล *
            </FieldLabel>
            <Select
              value={storeId}
              disabled={Boolean(target.role)}
              onValueChange={setStoreId}
            >
              <SelectTrigger id="store-select" className="w-full">
                <SelectValue placeholder="เลือกร้านค้าในงาน" />
              </SelectTrigger>
              <SelectContent>
                {stores.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    ยังไม่มีร้านค้าในงานนี้
                  </SelectItem>
                ) : (
                  stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Field>
        )}

        <Button
          type="submit"
          variant="brand"
          className="w-full min-h-10 text-on-brand hover:bg-brand-hover cursor-pointer font-medium"
          disabled={busy || (role === "VENDOR" && !storeId)}
        >
          {busy ? "กำลังบันทึก..." : "บันทึกบทบาท"}
        </Button>

        {/* ถอนบทบาท */}
        {target.role && (
          <div className="space-y-3 border-t pt-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <Checkbox
                checked={confirmRevoke}
                onCheckedChange={(c) => setConfirmRevoke(c === true)}
              />
              <span>ยืนยันว่าต้องการถอนบทบาทนี้</span>
            </label>
            <Button
              type="button"
              variant="destructive"
              className="w-full min-h-9 cursor-pointer"
              disabled={busy || !confirmRevoke}
              onClick={handleRevoke}
            >
              ถอนบทบาท
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  );
}
