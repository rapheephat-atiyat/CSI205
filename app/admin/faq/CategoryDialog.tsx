"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { FaqCategoryAdminItem, FaqCategoryInput } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "./FaqIcon";

type Props = {
  category: FaqCategoryAdminItem | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (category: FaqCategoryAdminItem) => void;
};

export default function CategoryDialog({
  category,
  onClose,
  onSaved,
  onDelete,
}: Props) {
  const [icon, setIcon] = useState(category?.icon ?? "circle-question-mark");
  const [saving, setSaving] = useState(false);
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: FaqCategoryInput = {
      name: String(form.get("name")).trim(),
      icon,
      sortOrder: Number(form.get("sortOrder")),
      isPublished: form.has("isPublished"),
    };
    setSaving(true);
    try {
      const result = category
        ? await api.admin.faq.categories.update(category.id, input)
        : await api.admin.faq.categories.create(input);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      onSaved();
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
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
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
          <DialogTitle>
            {category ? "แก้ไขหมวดคำถาม" : "เพิ่มหมวดคำถาม"}
          </DialogTitle>
          <DialogDescription>
            ตั้งชื่อ เลือกไอคอน และกำหนดการแสดงหมวดบนหน้าช่วยเหลือ
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <fieldset disabled={saving} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="faq-category-name">ชื่อหมวด</Label>
              <Input
                id="faq-category-name"
                name="name"
                defaultValue={category?.name ?? ""}
                required
                maxLength={255}
                placeholder="เช่น การจองบัตร"
                className="h-11"
              />
            </div>
            <IconPicker value={icon} onChange={setIcon} />
            <div className="space-y-2">
              <Label htmlFor="faq-category-order">ลำดับแสดงผล</Label>
              <Input
                id="faq-category-order"
                name="sortOrder"
                type="number"
                min={0}
                max={2147483647}
                step={1}
                defaultValue={category?.sortOrder ?? 0}
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">เลขน้อยแสดงก่อน</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <Label htmlFor="faq-category-published" className="min-h-6">
                <Checkbox
                  id="faq-category-published"
                  name="isPublished"
                  defaultChecked={category?.isPublished ?? false}
                />
                เผยแพร่หมวดนี้
              </Label>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                เมื่อซ่อนหมวด คำถามทั้งหมดในหมวดจะไม่แสดงบนหน้าช่วยเหลือ
              </p>
            </div>
          </fieldset>
          <DialogFooter className="mt-6">
            {category && (
              <Button
                type="button"
                variant="destructive"
                className="h-11 sm:mr-auto"
                disabled={saving}
                onClick={() => onDelete(category)}
              >
                ลบหมวด
              </Button>
            )}
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
              type="submit"
              variant="brand"
              className="h-11"
              disabled={saving}
            >
              {saving ? "กำลังบันทึก…" : "บันทึกหมวด"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
