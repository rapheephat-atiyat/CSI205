"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type {
  FaqCategoryAdminItem,
  FaqQuestionAdminItem,
  FaqQuestionInput,
} from "@/lib/api-types";
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
import { Textarea } from "@/components/ui/textarea";

type Props = {
  question: FaqQuestionAdminItem | null;
  categories: FaqCategoryAdminItem[];
  defaultCategoryId: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function QuestionDialog({
  question,
  categories,
  defaultCategoryId,
  onClose,
  onSaved,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [opener] = useState(() =>
    typeof document === "undefined" ? null : document.activeElement,
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: FaqQuestionInput = {
      categoryId: String(form.get("categoryId")),
      question: String(form.get("question")).trim(),
      answer: String(form.get("answer")).trim(),
      keywords: String(form.get("keywords"))
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean),
      linkLabel: String(form.get("linkLabel")).trim() || null,
      linkHref: String(form.get("linkHref")).trim() || null,
      sortOrder: Number(form.get("sortOrder")),
      isPublished: form.has("isPublished"),
    };
    if (Boolean(input.linkLabel) !== Boolean(input.linkHref)) {
      toast.error("กรุณาระบุข้อความลิงก์และ URL ให้ครบทั้งคู่");
      return;
    }
    setSaving(true);
    try {
      const result = question
        ? await api.admin.faq.questions.update(question.id, input)
        : await api.admin.faq.questions.create(input);
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
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
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
          <DialogTitle>{question ? "แก้ไขคำถาม" : "เพิ่มคำถาม"}</DialogTitle>
          <DialogDescription>
            เขียนคำถามและคำตอบ แล้วเลือกเผยแพร่หรือเก็บเป็นฉบับร่าง
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <fieldset disabled={saving} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="faq-question-category">หมวดคำถาม</Label>
              <select
                id="faq-question-category"
                name="categoryId"
                defaultValue={question?.categoryId ?? defaultCategoryId}
                required
                className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 disabled:opacity-50"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.isPublished ? "" : " (ซ่อนหมวด)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-question-title">คำถาม</Label>
              <Input
                id="faq-question-title"
                name="question"
                defaultValue={question?.question ?? ""}
                required
                maxLength={500}
                placeholder="เช่น ซื้อบัตรแล้วดูบัตรได้ที่ไหน?"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-question-answer">คำตอบ</Label>
              <Textarea
                id="faq-question-answer"
                name="answer"
                defaultValue={question?.answer ?? ""}
                required
                rows={5}
                placeholder="อธิบายขั้นตอนหรือคำตอบให้ผู้ใช้เข้าใจง่าย"
                className="min-h-32 field-sizing-fixed leading-7"
              />
            </div>
            <Label
              htmlFor="faq-question-published"
              className="min-h-11 rounded-lg bg-muted/50 p-3"
            >
              <Checkbox
                id="faq-question-published"
                name="isPublished"
                defaultChecked={question?.isPublished ?? false}
              />
              เผยแพร่คำถามนี้
            </Label>
            <details className="rounded-lg border border-border">
              <summary className="min-h-11 cursor-pointer p-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-brand">
                ตัวเลือกเพิ่มเติม
              </summary>
              <div className="space-y-4 border-t p-4">
                <div className="space-y-2">
                  <Label htmlFor="faq-question-keywords">คำค้นเพิ่มเติม</Label>
                  <Input
                    id="faq-question-keywords"
                    name="keywords"
                    defaultValue={question?.keywords.join(", ") ?? ""}
                    placeholder="บัตร, ตั๋ว, QR"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    คั่นแต่ละคำด้วยเครื่องหมาย ,
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faq-question-link-label">ข้อความลิงก์</Label>
                  <Input
                    id="faq-question-link-label"
                    name="linkLabel"
                    defaultValue={question?.linkLabel ?? ""}
                    maxLength={150}
                    placeholder="เช่น ไปที่บัตรของฉัน"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faq-question-link-href">URL ลิงก์</Label>
                  <Input
                    id="faq-question-link-href"
                    name="linkHref"
                    defaultValue={question?.linkHref ?? ""}
                    placeholder="/account/tickets หรือ https://…"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faq-question-order">ลำดับแสดงผล</Label>
                  <Input
                    id="faq-question-order"
                    name="sortOrder"
                    type="number"
                    min={0}
                    max={2147483647}
                    step={1}
                    defaultValue={question?.sortOrder ?? 0}
                    required
                    className="h-11"
                  />
                </div>
              </div>
            </details>
          </fieldset>
          <DialogFooter className="mt-6">
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
              {saving ? "กำลังบันทึก…" : "บันทึกคำถาม"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
