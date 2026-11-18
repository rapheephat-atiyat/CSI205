"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Upload,
  X,
  ShieldCheck,
  ChevronDown,
  User,
  Store,
  ArrowLeft,
  Lock,
  Phone,
  CreditCard,
  Mail,
  Globe,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import Navabr from "@/components/layout/Navabr";
import { VisualProfileCard } from "@/components/profile/VisualProfileCard";
import { WalletOverview } from "@/components/profile/WalletOverview";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";

type TabKey = "profile" | "card" | "contact" | "security";

interface ProfileFormState {
  username: string;
  firstName: string;
  nickname: string;
  role: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  website: string;
  lineId: string;
  bio: string;
}

const TAB_CONFIG: Record<TabKey, { label: string; title: string; icon: React.ElementType }> = {
  profile: {
    label: "โปรไฟล์",
    title: "ข้อมูลโปรไฟล์",
    icon: User,
  },
  card: {
    label: "บัตร & กระเป๋าเงิน",
    title: "บัตร & กระเป๋าเงิน",
    icon: CreditCard,
  },
  contact: {
    label: "ข้อมูลติดต่อ",
    title: "ข้อมูลติดต่อ",
    icon: Phone,
  },
  security: {
    label: "ความปลอดภัย",
    title: "ความปลอดภัย & รหัสผ่าน",
    icon: Lock,
  },
};

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = React.useState<TabKey>("profile");

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>("/images/avatar-default.svg");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<ProfileFormState>({
    username: "gene.rodrig",
    firstName: "เต",
    nickname: "พี่เต",
    role: "ศิษย์เก่า (Alumni)",
    lastName: "วรกร",
    displayName: "พี่เต วรกร",
    email: "tae.waragon@spumail.net",
    phone: "081 234 5678",
    website: "https://spu.ac.th",
    lineId: "@tae_spu",
    bio: "ศิษย์เก่าคณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยศรีปทุม รุ่น 42 ยินดีที่ได้กลับมาพบเพื่อนๆ ทุกคนในงานคืนสู่เหย้าครับ",
  });

  // Wallet and Role State
  const [userId, setUserId] = React.useState("usr-spu-00428");
  const [memberCode, setMemberCode] = React.useState("SPU-00428");
  const [walletBalance, setWalletBalance] = React.useState("1250.00");
  const [storeBalance, setStoreBalance] = React.useState<string | null>(null);
  const [storeName, setStoreName] = React.useState<string | null>(null);
  const [storeId, setStoreId] = React.useState<string | null>(null);
  // isVendorMode is derived ONLY from real API data — never from UI toggle
  const [isVendorMode, setIsVendorMode] = React.useState(false);

  // Password state
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Load real user data if available from session or api
  React.useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      try {
        const res = await api.me.get();
        if (res.success && isMounted) {
          const user = res.data;
          setUserId(user.id);
          setMemberCode(`SPU-${user.id.slice(0, 5).toUpperCase()}`);
          if (user.walletBalance) {
            setWalletBalance(user.walletBalance);
          }
          if (user.image) {
            setAvatarUrl(user.image);
          }

          const hasVendorRole = user.roles?.some(
            (r) => r.role === "VENDOR" || (!!r.storeId && r.permissions?.some(
              (p) => p === "store.sell" || p === "store.manage"
            ))
          );
          if (hasVendorRole) {
            setIsVendorMode(true);
            // Fetch real store data — if GET /api/store succeeds, user has a store
            try {
              const storeRes = await api.store.getMy();
              if (storeRes.success) {
                setStoreBalance(storeRes.data.walletBalance);
                setStoreName(storeRes.data.name);
                setStoreId(storeRes.data.id);
              }
            } catch {
              // Store fetch failed — keep isVendorMode true but show no balance
            }
          }

          setFormData((prev) => ({
            ...prev,
            username: user.username || prev.username,
            firstName: user.firstName || prev.firstName,
            lastName: user.lastName || prev.lastName,
            displayName: user.name || `${user.firstName} ${user.lastName}`.trim() || prev.displayName,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            role: hasVendorRole ? "เจ้าของร้านค้า (Vendor)" : prev.role,
          }));
        }
      } catch {
        if (session?.user && isMounted) {
          setUserId(session.user.id);
          setMemberCode(`SPU-${session.user.id.slice(0, 5).toUpperCase()}`);
          setFormData((prev) => ({
            ...prev,
            displayName: session.user.name || prev.displayName,
            email: session.user.email || prev.email,
          }));
        }
      }
    }
    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [session]);

  // Handle role change in form (if admin or demo changes role)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "role") {
      // role field is display-only — vendor mode is set from real API data only
      return;
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      toast.success("อัปโหลดรูปภาพสำเร็จ");
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("ลบรูปโปรไฟล์แล้ว");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const currentTabInfo = TAB_CONFIG[activeTab];
  const CurrentTabIcon = currentTabInfo.icon;

  return (
    <div className="min-h-screen w-full bg-[#fcf8f7] text-[#1e1e1e] flex flex-col justify-between font-sans antialiased selection:bg-[#b62b38]/15 selection:text-[#b62b38]">
      {/* Top Navbar */}
      <React.Suspense fallback={<div className="h-(--navbar-height) w-full bg-background border-b" />}>
        <Navabr />
      </React.Suspense>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>กลับหน้าหลัก</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
              <ShieldCheck className="size-3.5 text-[#059669]" />
              <span>สมาชิกที่ยืนยันแล้ว</span>
            </span>

            {isVendorMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Store className="size-3.5 text-amber-600" />
                <span>ร้านค้าพาร์ทเนอร์</span>
              </span>
            )}
          </div>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            โปรไฟล์ & บัญชีผู้ใช้
          </h1>
        </div>

        {/* ========================================================================= */}
        {/* MAIN CARD WITH DYNAMIC HEADER TEXT & TABS                                */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#efe6e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header Row: Dynamic Title (Left) + Tabs (Middle) + Member ID (Right) */}
          <div className="border-b border-[#efe6e4] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/60">
            {/* Left: DYNAMIC TITLE BASED ON ACTIVE TAB */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#b62b38] transition-all">
              <CurrentTabIcon className="size-4 text-[#b62b38]" />
              <span>{currentTabInfo.title}</span>
            </div>

            {/* Middle: 4 Tabs navigation */}
            <nav
              aria-label="เมนูแท็บจัดการโปรไฟล์"
              className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 border border-zinc-200 shadow-inner"
            >
              {(Object.keys(TAB_CONFIG) as TabKey[]).map((tabKey) => {
                const tab = TAB_CONFIG[tabKey];
                const Icon = tab.icon;
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-[#b62b38] shadow-xs border border-black/5 font-semibold"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                    {tabKey === "card" && isVendorMode && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-zinc-800 text-white">
                        ร้านค้า
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Card Body: Dynamic Content according to Active Tab */}
          <div className="p-6 sm:p-10">
            {/* ===================================================================== */}
            {/* TAB 1: โปรไฟล์ (Profile Info & Avatar)                                */}
            {/* ===================================================================== */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-in fade-in duration-200">
                {/* Left: Avatar Photo */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="relative w-full aspect-[4/4.5] max-w-[260px] mx-auto rounded-2xl overflow-hidden bg-[#f8ded4] border border-[#efe6e4] flex items-center justify-center">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile Avatar"
                        fill
                        sizes="(max-width: 768px) 100vw, 260px"
                        className="object-cover object-center"
                        unoptimized
                      />
                    ) : (
                      <div className="size-20 rounded-full bg-[#fde8ea] text-[#b62b38] font-bold text-2xl flex items-center justify-center">
                        {formData.firstName ? formData.firstName.charAt(0) : "U"}
                      </div>
                    )}

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-3 right-3 size-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Remove photo"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-[260px] mx-auto h-10 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-xl text-xs font-medium text-zinc-700 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Upload className="size-3.5 text-zinc-500" />
                    <span>อัปโหลดรูปภาพใหม่</span>
                  </button>
                </div>

                {/* Right: Profile Info Form */}
                <div className="lg:col-span-8">
                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700">
                          ชื่อผู้ใช้ (Username)
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700">
                          ชื่อจริง (First Name)
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700">
                          ชื่อเล่น (Nickname)
                        </label>
                        <input
                          type="text"
                          name="nickname"
                          value={formData.nickname}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700">
                          บทบาทในระบบ (Role)
                        </label>
                        <div className="relative">
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full h-10 px-3.5 pr-10 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 appearance-none focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                          >
                            <option value="ศิษย์เก่า (Alumni)">ศิษย์เก่า (Alumni)</option>
                            <option value="อาจารย์ / บุคลากร">อาจารย์ / บุคลากร</option>
                            <option value="ศิษย์ปัจจุบัน">ศิษย์ปัจจุบัน</option>
                            <option value="เจ้าของร้านค้า (Vendor)">เจ้าของร้านค้า (Vendor)</option>
                            <option value="ผู้ดูแลระบบ (Admin)">ผู้ดูแลระบบ (Admin)</option>
                          </select>
                          <ChevronDown className="size-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700">
                          นามสกุล (Last Name)
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-zinc-700">
                          ชื่อแสดงผล (Display Name)
                        </label>
                        <input
                          type="text"
                          name="displayName"
                          value={formData.displayName}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700">
                        ประวัติโดยย่อ (Bio)
                      </label>
                      <textarea
                        name="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all resize-y"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                      <button
                        type="submit"
                        className="px-5 h-10 bg-[#b62b38] hover:bg-[#9e2430] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
                      >
                        บันทึกข้อมูล
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 2: บัตร & กระเป๋าเงิน (Clean & Minimalist)                        */}
            {/* ===================================================================== */}
            {activeTab === "card" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in duration-200">
                {/* 3D Flip Card */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <VisualProfileCard
                    userId={userId}
                    memberCode={memberCode}
                    displayName={formData.displayName || `${formData.firstName} ${formData.lastName}`}
                    username={formData.username}
                    role={formData.role}
                    isVendor={isVendorMode}
                    walletBalance={walletBalance}
                    storeName={storeName ?? undefined}
                  />
                </div>

                {/* Wallets */}
                <div className="lg:col-span-7">
                  <WalletOverview
                    isVendor={isVendorMode}
                    userBalance={walletBalance}
                    storeBalance={storeBalance ?? "0.00"}
                    storeName={storeName ?? "ร้านค้า"}
                    storeId={storeId ?? undefined}
                  />
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 3: ข้อมูลติดต่อ (Contact Information)                             */}
            {/* ===================================================================== */}
            {activeTab === "contact" && (
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-3xl animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                      <Mail className="size-3.5 text-zinc-400" />
                      <span>อีเมล</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                      <Phone className="size-3.5 text-zinc-400" />
                      <span>เบอร์โทรศัพท์</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="081 234 5678"
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                      <Globe className="size-3.5 text-zinc-400" />
                      <span>เว็บไซต์</span>
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://spu.ac.th"
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-zinc-400" />
                      <span>LINE ID</span>
                    </label>
                    <input
                      type="text"
                      name="lineId"
                      value={formData.lineId}
                      onChange={handleInputChange}
                      placeholder="@tae_spu"
                      className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-zinc-100">
                  <button
                    type="submit"
                    className="px-5 h-10 bg-[#b62b38] hover:bg-[#9e2430] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    บันทึกข้อมูลติดต่อ
                  </button>
                </div>
              </form>
            )}

            {/* ===================================================================== */}
            {/* TAB 4: ความปลอดภัย (Clean Password Form only, NO AI filler widget)     */}
            {/* ===================================================================== */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-700">
                    รหัสผ่านเดิม
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-700">
                    รหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-700">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 h-10 bg-[#b62b38] hover:bg-[#9e2430] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    เปลี่ยนรหัสผ่าน
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="w-full py-6 text-center text-xs text-zinc-400 border-t border-zinc-200/60 bg-white">
        © 2026 TUATUA • ศรีปทุม สปิริตแพลตฟอร์ม (SPU)
      </footer>
    </div>
  );
}
