"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleHelp,
  FileQuestion,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type {
  FaqCategoryAdminItem,
  FaqQuestionAdminItem,
} from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import CategoryDialog from "./CategoryDialog";
import QuestionDialog from "./QuestionDialog";
import DeleteDialog, { type DeleteTarget } from "./DeleteDialog";
import { FaqIcon } from "./FaqIcon";

export default function FaqManager() {
  const [categories, setCategories] = useState<FaqCategoryAdminItem[]>([]);
  const [selectedId, setSelectedId] = useState("all");
  const [search, setSearch] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<FaqCategoryAdminItem | null>(null);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<FaqQuestionAdminItem | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);

  const selectedCategory = categories.find(
    (category) => category.id === selectedId,
  );
  const allQuestions = categories.flatMap((category) => category.questions);
  const questions = (
    selectedCategory ? selectedCategory.questions : allQuestions
  ).filter((question) =>
    `${question.question} ${question.answer} ${question.keywords.join(" ")}`
      .toLocaleLowerCase("th")
      .includes(search.trim().toLocaleLowerCase("th")),
  );

  const loadFaq = useCallback(async () => {
    try {
      const result = await api.admin.faq.list();
      setLoadFailed(!result.success);
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      setCategories(result.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFaq();
  }, [loadFaq]);

  function reload() {
    setLoading(true);
    void loadFaq();
  }

  function openCategory(category?: FaqCategoryAdminItem) {
    setEditingCategory(category ?? null);
    setCategoryOpen(true);
  }

  function openQuestion(question?: FaqQuestionAdminItem) {
    setEditingQuestion(question ?? null);
    setQuestionOpen(true);
  }

  function saved() {
    setCategoryOpen(false);
    setQuestionOpen(false);
    toast.success("บันทึกเรียบร้อยแล้ว");
    void reload();
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/admin"
        className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-sm text-sm text-muted-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        กลับไปจัดการงาน
      </Link>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            จัดการ FAQ
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            จัดหมวดคำถามและเขียนคำตอบสำหรับหน้าช่วยเหลือ
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 gap-2 bg-background"
          disabled={loading}
          onClick={() => openCategory()}
        >
          <Plus aria-hidden="true" />
          เพิ่มหมวด
        </Button>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside
          aria-label="หมวดคำถาม"
          className="rounded-xl border border-border/70 bg-background p-3"
        >
          <div className="flex items-center justify-between px-3 py-3">
            <h2 className="text-sm font-medium">หมวดคำถาม</h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {categories.length} หมวด
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId("all")}
            aria-pressed={selectedId === "all"}
            className={cn(
              "mb-2 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-brand",
              selectedId === "all"
                ? "bg-brand-soft font-medium text-brand"
                : "hover:bg-muted",
            )}
          >
            <Layers className="size-5" aria-hidden="true" />
            <span className="flex-1 text-left">คำถามทั้งหมด</span>
            <span className="text-xs tabular-nums">{allQuestions.length}</span>
          </button>
          <div className="space-y-1">
            {categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  "flex items-center rounded-lg",
                  selectedId === category.id
                    ? "bg-brand-soft"
                    : "hover:bg-muted/70",
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(category.id)}
                  aria-pressed={selectedId === category.id}
                  className="flex min-h-16 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-3 text-left focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span
                    className={
                      selectedId === category.id
                        ? "text-brand"
                        : "text-muted-foreground"
                    }
                  >
                    <FaqIcon name={category.icon} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm wrap-anywhere",
                        selectedId === category.id && "font-medium text-brand",
                      )}
                    >
                      {category.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {category.questions.length} คำถาม ·{" "}
                      {category.isPublished ? "เผยแพร่" : "ซ่อนหมวด"}
                    </span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-1 size-11 shrink-0 text-muted-foreground"
                  aria-label={`แก้ไขหมวด ${category.name}`}
                  onClick={() => openCategory(category)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
          {!categories.length && (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              {loading
                ? "กำลังโหลดหมวด…"
                : loadFailed
                  ? "โหลดหมวดไม่สำเร็จ"
                  : "ยังไม่มีหมวดคำถาม"}
            </p>
          )}
          <Button
            variant="ghost"
            className="mt-3 h-11 w-full justify-start gap-3 text-brand"
            disabled={loading}
            onClick={() => openCategory()}
          >
            <Plus aria-hidden="true" />
            เพิ่มหมวดคำถาม
          </Button>
        </aside>

        <section
          aria-labelledby="faq-list-title"
          aria-busy={loading}
          className="min-w-0 rounded-xl border border-border/70 bg-background"
        >
          <div className="space-y-5 border-b border-border/70 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="faq-list-title"
                  tabIndex={-1}
                  className="text-lg font-semibold wrap-anywhere"
                >
                  {selectedCategory?.name ?? "คำถามทั้งหมด"}
                </h2>
                <p role="status" className="mt-1 text-xs text-muted-foreground">
                  {loading ? "กำลังอัปเดตรายการ…" : `${questions.length} คำถาม`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="โหลด FAQ อีกครั้ง"
                  disabled={loading}
                  onClick={reload}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="brand"
                  className="h-11 gap-2"
                  disabled={!categories.length || loading}
                  onClick={() => openQuestion()}
                >
                  <Plus aria-hidden="true" />
                  เพิ่มคำถาม
                </Button>
              </div>
            </div>
            <div className="relative">
              <label htmlFor="faq-search" className="sr-only">
                ค้นหาคำถาม
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="faq-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาคำถาม คำตอบ หรือคำค้นเพิ่มเติม"
                className="h-11 bg-muted/25 pl-10"
              />
            </div>
            {selectedCategory && !selectedCategory.isPublished && (
              <p className="rounded-lg bg-muted p-3 text-sm leading-6 text-muted-foreground">
                หมวดนี้ถูกซ่อน
                คำถามภายในจะยังไม่แสดงบนหน้าช่วยเหลือจนกว่าจะเผยแพร่หมวด
              </p>
            )}
          </div>

          <div className="divide-y divide-border/70">
            {questions.map((question) => {
              const category = categories.find(
                (item) => item.id === question.categoryId,
              );
              const visible = question.isPublished && category?.isPublished;
              return (
                <article key={question.id} className="p-5 sm:p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{category?.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        visible
                          ? "border-brand/20 bg-brand-soft text-brand"
                          : "text-muted-foreground"
                      }
                    >
                      {visible && <Check aria-hidden="true" />}
                      {visible
                        ? "เผยแพร่"
                        : question.isPublished
                          ? "ซ่อนตามหมวด"
                          : "ฉบับร่าง"}
                    </Badge>
                  </div>
                  <h3 className="text-base font-medium wrap-anywhere">
                    {question.question}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-7 wrap-anywhere whitespace-pre-line text-muted-foreground">
                    {question.answer}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      ลำดับ {question.sortOrder}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        className="h-11 gap-2"
                        aria-label={`แก้ไขคำถาม ${question.question}`}
                        onClick={() => openQuestion(question)}
                      >
                        <Pencil aria-hidden="true" />
                        แก้ไข
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-11 gap-2 text-destructive hover:text-destructive"
                        aria-label={`ลบคำถาม ${question.question}`}
                        onClick={() =>
                          setDeleting({
                            type: "question",
                            id: question.id,
                            name: question.question,
                          })
                        }
                      >
                        <Trash2 aria-hidden="true" />
                        ลบ
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {loading && !categories.length ? (
            <div className="space-y-4 p-6" aria-label="กำลังโหลดคำถาม">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : loadFailed && !categories.length ? (
            <div className="space-y-4 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                โหลดรายการไม่สำเร็จ กรุณาลองอีกครั้ง
              </p>
              <Button variant="outline" className="h-11" onClick={reload}>
                ลองโหลดอีกครั้ง
              </Button>
            </div>
          ) : (
            !questions.length && (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <FileQuestion
                  className="mb-4 size-10 text-muted-foreground/60"
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
                <h3 className="font-medium">
                  {search
                    ? "ไม่พบคำถามที่ค้นหา"
                    : categories.length
                      ? "ยังไม่มีคำถามในรายการนี้"
                      : "เริ่มจากสร้างหมวดคำถาม"}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  {search
                    ? "ลองเปลี่ยนคำค้นหรือเลือกหมวดอื่น"
                    : categories.length
                      ? "เพิ่มคำถามและคำตอบ แล้วเลือกเผยแพร่เมื่อพร้อม"
                      : "เช่น การจองบัตร การชำระเงิน หรือการเข้างาน"}
                </p>
                {search ? (
                  <Button
                    variant="outline"
                    className="mt-5 h-11"
                    onClick={() => setSearch("")}
                  >
                    ล้างคำค้นหา
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-5 h-11 gap-2"
                    onClick={() =>
                      categories.length ? openQuestion() : openCategory()
                    }
                  >
                    <Plus aria-hidden="true" />
                    {categories.length ? "เพิ่มคำถามแรก" : "สร้างหมวดแรก"}
                  </Button>
                )}
              </div>
            )
          )}
          <p className="flex items-start gap-2 border-t border-border/70 px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
            <CircleHelp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            คำถามจะแสดงให้ผู้ใช้เห็นเมื่อเผยแพร่ทั้งหมวดและคำถามแล้ว
          </p>
        </section>
      </div>

      {categoryOpen && (
        <CategoryDialog
          category={editingCategory}
          onClose={() => setCategoryOpen(false)}
          onSaved={saved}
          onDelete={(category) => {
            setCategoryOpen(false);
            setDeleting({
              type: "category",
              id: category.id,
              name: category.name,
            });
          }}
        />
      )}
      {questionOpen && (
        <QuestionDialog
          question={editingQuestion}
          categories={categories}
          defaultCategoryId={selectedCategory?.id ?? categories[0]?.id ?? ""}
          onClose={() => setQuestionOpen(false)}
          onSaved={saved}
        />
      )}
      {deleting && (
        <DeleteDialog
          target={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            if (deleting.type === "category" && deleting.id === selectedId)
              setSelectedId("all");
            setDeleting(null);
            toast.success("ลบเรียบร้อยแล้ว");
            void reload();
          }}
        />
      )}
    </div>
  );
}
