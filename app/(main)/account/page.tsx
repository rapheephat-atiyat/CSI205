"use client";

import * as React from "react";
import Image from "next/image";
import {
  Upload,
  X,
  ShieldCheck,
  User,
  Store,
  Phone,
  CreditCard,
  Mail,
  Globe,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { VisualProfileCard } from "@/components/profile/VisualProfileCard";
import { WalletOverview } from "@/components/profile/WalletOverview";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";

type TabKey = "profile" | "card" | "contact";

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
  graduationInstitution: string;
  graduationYear: string;
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
};

export default function AccountProfilePage() {
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = React.useState<TabKey>("profile");

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>("/images/avatar-default.svg");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<ProfileFormState>({
    username: "",
    firstName: "",
    nickname: "",
    role: "ศิษย์เก่า (Alumni)",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    website: "",
    lineId: "",
    graduationInstitution: "",
    graduationYear: "",
    bio: "",
  });

  // Wallet and Role State
  const [userId, setUserId] = React.useState("usr-spu-00428");
  const [memberCode, setMemberCode] = React.useState("SPU-00428");
  const [walletBalance, setWalletBalance] = React.useState("1250.00");
  const [storeBalance, setStoreBalance] = React.useState<string | null>(null);
  const [storeName, setStoreName] = React.useState<string | null>(null);
  const [storeId, setStoreId] = React.useState<string | null>(null);
  const [isVendorMode, setIsVendorMode] = React.useState(false);

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
            try {
              const storeRes = await api.store.getMy();
              if (storeRes.success) {
                setStoreBalance(storeRes.data.walletBalance);
                setStoreName(storeRes.data.name);
                setStoreId(storeRes.data.id);
              }
            } catch {
              // Store fetch failed
            }
          }

          setFormData((prev) => ({
            ...prev,
            username: user.username || prev.username,
            firstName: user.firstName || prev.firstName,
            lastName: user.lastName || prev.lastName,
            displayName: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || prev.displayName,
            email: user.email || prev.email,
            phone: user.phone || prev.phone,
            graduationInstitution: "",
            graduationYear: "",
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "role") {
      return;
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("ขนาดไฟล์เกิน 2MB กรุณาเลือกรูปขนาดเล็กลง");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        toast.success("เลือกรูปภาพแล้ว กด 'บันทึกข้อมูล' เพื่อบันทึกลงระบบ");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gradDate = formData.graduationYear.trim()
        ? `${formData.graduationYear.trim()}-01-01`
        : null;

      const res = await api.me.update({
        name: formData.displayName,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        graduationInstitution: formData.graduationInstitution.trim() || null,
        graduationAt: gradDate,
        image: avatarUrl === "/images/avatar-default.svg" ? null : avatarUrl,
      });

      if (res.success) {
        toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
        if (res.data.image) {
          setAvatarUrl(res.data.image);
        }
      } else {
        toast.error(res.error.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const tabs: TabKey[] = ["profile", "card", "contact"];
  const currentTabConfig = TAB_CONFIG[activeTab];
  const ActiveIcon = currentTabConfig.icon;

  return (
    <div className="space-y-4">
      {/* Header with Title and Verified Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            โปรไฟล์ & บัญชีผู้ใช้
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            จัดการข้อมูลส่วนตัว บัตรสมาชิกเสมือน 3D และกระเป๋าเงินของคุณ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            <span>สมาชิกที่ยืนยันแล้ว</span>
          </div>

          {isVendorMode && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
              <Store className="size-3.5" />
              <span>ร้านค้าพาร์ทเนอร์</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        {/* Header Bar inside Card: Dynamic Title & Tabs */}
        <div className="border-b border-zinc-200 px-5 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-50/50">
          {/* Left: Dynamic Title based on Active Tab */}
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
            <ActiveIcon className="size-4 text-[#b62b38]" />
            <span>{currentTabConfig.title}</span>
          </div>

          {/* Right: Tab Switcher Pills */}
          <nav className="inline-flex p-1 rounded-xl bg-zinc-100/80 border border-zinc-200/80 gap-1 self-start md:self-auto overflow-x-auto max-w-full">
            {tabs.map((tabKey) => {
              const tab = TAB_CONFIG[tabKey];
              const TabIcon = tab.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-white/50"
                  }`}
                >
                  <TabIcon className={`size-3.5 ${isActive ? "text-[#b62b38]" : "text-zinc-400"}`} />
                  <span>{tab.label}</span>
                  {tabKey === "card" && isVendorMode && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-normal bg-zinc-900 text-white">
                      ร้านค้า
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Card Body: Dynamic Content according to Active Tab */}
        <div className="p-5 sm:p-8">
          {/* ===================================================================== */}
          {/* TAB 1: ข้อมูลโปรไฟล์ (Profile Form)                                  */}
          {/* ===================================================================== */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-200">
              {/* Left Column: Avatar Upload */}
              <div className="lg:col-span-4 flex flex-col items-center p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="relative group">
                  <div className="relative size-32 rounded-full overflow-hidden border-2 border-zinc-200 bg-white shadow-xs">
                    <Image
                      src={avatarUrl || "/images/avatar-default.svg"}
                      alt="Profile Avatar"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {avatarUrl && avatarUrl !== "/images/avatar-default.svg" && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("/images/avatar-default.svg")}
                      aria-label="ลบรูปโปรไฟล์"
                      className="absolute -top-1 -right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-sm transition-colors cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {formData.displayName || `${formData.firstName} ${formData.lastName}`}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">@{formData.username}</p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 w-full h-9 flex items-center justify-center gap-2 border border-zinc-200 hover:bg-white text-zinc-700 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <Upload className="size-3.5 text-zinc-500" />
                  <span>อัปโหลดรูปภาพใหม่</span>
                </button>
                <p className="text-[11px] text-zinc-400 mt-2 text-center">
                  รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5MB
                </p>
              </div>

              {/* Right Column: Profile Information Form */}
              <div className="lg:col-span-8">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700">
                        ชื่อผู้ใช้ (Username)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs sm:text-sm">
                          @
                        </span>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full h-10 pl-8 pr-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                        />
                      </div>
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

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700">
                        จบจากสถาบัน / มหาวิทยาลัย
                      </label>
                      <input
                        type="text"
                        name="graduationInstitution"
                        value={formData.graduationInstitution}
                        onChange={handleInputChange}
                        className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-700">
                        รุ่นศิษย์เก่า / ปีที่จบการศึกษา
                      </label>
                      <input
                        type="number"
                        name="graduationYear"
                        min="1950"
                        max="2099"
                        value={formData.graduationYear}
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
                      placeholder="เขียนแนะนำตัวเองสั้นๆ (ไม่บังคับ)"
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
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl animate-in fade-in duration-200">
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
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm text-zinc-500 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-[11px] text-zinc-400">อีเมลเชื่อมโยงกับบัญชีหลัก ไม่สามารถเปลี่ยนได้</p>
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
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-zinc-400" />
                    <span>เว็บไซต์ / พอร์ตโฟลิโอ</span>
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                    <MessageSquare className="size-3.5 text-zinc-400" />
                    <span>Line ID</span>
                  </label>
                  <input
                    type="text"
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3.5 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#b62b38] focus:ring-1 focus:ring-[#b62b38] transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="submit"
                  className="px-5 h-10 bg-[#b62b38] hover:bg-[#9e2430] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
                >
                  บันทึกข้อมูลติดต่อ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
