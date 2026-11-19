"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DeleteTarget = {
  type: "category" | "question";
  id: string;
  name: string;
};

export default function DeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: DeleteTarget;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );
  const label = target.type === "category" ? "หมวด" : "คำถาม";

  async function remove() {
    setSaving(true);
    try {
      const result =
        target.type === "category"
          ? await api.admin.faq.categories.delete(target.id)
          : await api.admin.faq.questions.delete(target.id);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      onDeleted();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!saving}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target =
            !saving && opener instanceof HTMLElement && opener.isConnected
              ? opener
              : document.getElementById("faq-list-title");
          target?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>ลบ{label}นี้?</DialogTitle>
          <DialogDescription className="wrap-anywhere">
            “{target.name}” จะถูกลบถาวร
            {target.type === "category"
              ? " โดยต้องย้ายหรือลบคำถามในหมวดออกก่อน"
              : " และไม่แสดงบนหน้าช่วยเหลืออีก"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={saving}
            onClick={onClose}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            variant="brand"
            className="h-11"
            disabled={saving}
            onClick={remove}
          >
            {saving ? "กำลังลบ…" : `ยืนยันลบ${label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
