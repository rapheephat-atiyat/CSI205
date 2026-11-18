"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, ChevronDown, ShieldCheck, GraduationCap } from "lucide-react";
import { api } from "@/lib/api-client";
import type { User as Profile, UserInput } from "@/lib/api-types";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface FormState {
    name: string;
    username: string;
    firstName: string;
    lastName: string;
    phone: string;
    graduationAt: string;
    graduationInstitution: string;
}

function toFormState(p: Profile): FormState {
    return {
        name: p.name ?? "",
        username: p.username ?? "",
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        phone: p.phone ?? "",
        graduationAt: p.graduationAt ? p.graduationAt.slice(0, 10) : "",
        graduationInstitution: p.graduationInstitution ?? "",
    };
}

export function ProfileClient({ profile }: { profile: Profile }) {
    const { refetch } = authClient.useSession();
    const [form, setForm] = React.useState<FormState>(toFormState(profile));
    const [avatarUrl, setAvatarUrl] = React.useState<string | null>(profile.image ?? null);
    const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarUrl(URL.createObjectURL(file));
    };

    const handleRemovePhoto = () => {
        setAvatarFile(null);
        setAvatarUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const input: UserInput = {
                name: form.name || undefined,
                username: form.username || null,
                firstName: form.firstName || undefined,
                lastName: form.lastName || undefined,
                phone: form.phone || null,
                graduationAt: form.graduationAt || null,
                graduationInstitution: form.graduationInstitution || null,
            };

            // ถ้ามีรูปใหม่ให้แปลงเป็น base64 ก่อน (หรือ URL ถ้า backend รับ URL)
            if (avatarFile) {
                const reader = new FileReader();
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(avatarFile);
                });
                input.image = dataUrl;
            } else if (avatarUrl === null && profile.image) {
                input.image = null;
            }

            const result = await api.me.update(input);
            if (!result.success) {
                toast.error(result.error.message);
                return;
            }
            await refetch();
            toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
        } catch {
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setIsSaving(false);
        }
    };

    const displayInit = (form.firstName || profile.name || "U").trim().charAt(0).toUpperCase();

    return (
        <form onSubmit={handleSave} className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">โปรไฟล์ของฉัน</h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        สมาชิกที่ยืนยันแล้ว
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    จัดการข้อมูลส่วนตัว ชื่อแสดงผล และข้อมูลติดต่อของคุณ
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                {/* Avatar Column */}
                <div className="space-y-4">
                    <div className="relative mx-auto w-full max-w-[200px] overflow-hidden rounded-2xl border bg-muted aspect-square flex items-center justify-center">
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="รูปโปรไฟล์"
                                fill
                                sizes="200px"
                                className="object-cover object-center"
                                unoptimized
                            />
                        ) : (
                            <span className="text-5xl font-bold text-muted-foreground/50">{displayInit}</span>
                        )}
                        {avatarUrl && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                aria-label="ลบรูปโปรไฟล์"
                                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        aria-label="เลือกรูปโปรไฟล์"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full max-w-[200px] mx-auto min-h-10 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Upload className="size-4" aria-hidden="true" />
                        อัปโหลดรูป
                    </button>

                    {/* Member ID */}
                    <div className="rounded-xl border bg-muted/40 p-3 text-xs">
                        <p className="text-muted-foreground">รหัสสมาชิก</p>
                        <p className="mt-0.5 font-mono font-semibold">{profile.id.slice(0, 8).toUpperCase()}</p>
                        <p className="mt-2 text-muted-foreground">อีเมล</p>
                        <p className="mt-0.5 font-medium break-all">{profile.email}</p>
                    </div>
                </div>

                {/* Form Column */}
                <div className="space-y-6">
                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ข้อมูลพื้นฐาน</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label htmlFor="firstName" className="block text-sm font-medium">ชื่อ <span className="text-destructive">*</span></label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    required
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="lastName" className="block text-sm font-medium">นามสกุล <span className="text-destructive">*</span></label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    required
                                    value={form.lastName}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="name" className="block text-sm font-medium">ชื่อแสดงผล (Display Name) <span className="text-destructive">*</span></label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="username" className="block text-sm font-medium">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="ไม่บังคับ"
                                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="space-y-4 border-t pt-5">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">ข้อมูลติดต่อ</h2>
                        <div className="space-y-1.5">
                            <label htmlFor="phone" className="block text-sm font-medium">เบอร์โทรศัพท์</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="0812345678"
                                className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                            />
                            <p className="text-xs text-muted-foreground">ตัวเลข 10 หลัก ไม่มีขีด</p>
                        </div>
                    </section>

                    {/* Education */}
                    <section className="space-y-4 border-t pt-5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            <GraduationCap className="size-4" aria-hidden="true" />
                            ประวัติการศึกษา
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label htmlFor="graduationInstitution" className="block text-sm font-medium">สถาบันการศึกษา</label>
                                <input
                                    id="graduationInstitution"
                                    name="graduationInstitution"
                                    type="text"
                                    value={form.graduationInstitution}
                                    onChange={handleChange}
                                    placeholder="เช่น มหาวิทยาลัยศรีปทุม"
                                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="graduationAt" className="block text-sm font-medium">วันที่จบการศึกษา</label>
                                <input
                                    id="graduationAt"
                                    name="graduationAt"
                                    type="date"
                                    value={form.graduationAt}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 border-t pt-5">
                        <button
                            type="button"
                            onClick={() => setForm(toFormState(profile))}
                            className="min-h-10 rounded-xl border bg-background px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            รีเซ็ต
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="min-h-10 rounded-xl bg-brand px-6 text-sm font-medium text-on-brand shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-60"
                        >
                            {isSaving ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
}
