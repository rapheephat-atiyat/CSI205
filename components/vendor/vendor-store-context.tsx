"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Store } from "lucide-react";
import type { StoreDetail } from "@/lib/api-types";

export interface VendorStore {
  id: string;
  eventId: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  location: string;
  image?: string;
  productImage?: string;
  banner?: string | null;
  status: "เปิดให้บริการ" | "ปิดชั่วคราว";
  walletBalance: string;
  product: StoreDetail["product"];
}

function mapStoreDetailToVendorStore(store: StoreDetail): VendorStore {
  return {
    id: store.id,
    eventId: store.eventId,
    code: `VND-${store.id.slice(0, 4).toUpperCase()}`,
    name: store.name,
    description: store.description,
    category: store.product?.title || "ร้านค้าในงาน",
    location: store.description || "พื้นที่จัดงาน",
    image: store.thumbnail || store.banner || undefined,
    productImage: store.product?.images[0] || undefined,
    banner: store.banner,
    status: "เปิดให้บริการ",
    walletBalance: store.walletBalance,
    product: store.product,
  };
}

interface VendorStoreContextType {
  stores: VendorStore[];
  selectedStore: VendorStore | null;
  selectStore: (store: VendorStore) => void;
  clearStore: () => void;
}

const VendorStoreContext = createContext<VendorStoreContextType | undefined>(undefined);

export function VendorStoreProvider({
  initialStores,
  children,
}: {
  initialStores: StoreDetail[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const stores = useMemo(
    () => initialStores.map(mapStoreDetailToVendorStore),
    [initialStores]
  );
  const [selectedStore, setSelectedStore] = useState<VendorStore | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedStoreId = sessionStorage.getItem("active_vendor_store_id");
    if (savedStoreId) {
      const found = stores.find((s) => s.id === savedStoreId);
      if (found) setSelectedStore(found);
    }
    setIsHydrated(true);
  }, [stores]);

  const selectStore = (store: VendorStore) => {
    setSelectedStore(store);
    sessionStorage.setItem("active_vendor_store_id", store.id);
    router.push("/vendor");
  };

  // เคลียร์ร้านที่เลือกเพื่อให้กลับมาหน้า StoreSelectionGate (เลือกร้านค้า)
  const clearStore = () => {
    setSelectedStore(null);
    sessionStorage.removeItem("active_vendor_store_id");
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <VendorStoreContext.Provider value={{ stores, selectedStore, selectStore, clearStore }}>
      {!selectedStore ? <StoreSelectionGate stores={stores} onSelect={selectStore} /> : children}
    </VendorStoreContext.Provider>
  );
}

export function useVendorStore() {
  const context = useContext(VendorStoreContext);
  if (!context) {
    throw new Error("useVendorStore must be used within a VendorStoreProvider");
  }
  return context;
}

// หน้าจอเลือกร้านค้าตามดีไซน์ Figma
function StoreSelectionGate({
  stores,
  onSelect,
}: {
  stores: VendorStore[];
  onSelect: (store: VendorStore) => void;
}) {
  return (
    <div className="min-h-screen w-full bg-[#fafafa] flex flex-col">
      {/* แถบ Top Header ด้านบน */}
      <header className="w-full bg-white border-b border-slate-100 px-6 md:px-10 h-14 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Personal workspace</span>
          <ChevronRight className="size-3.5 text-slate-400" />
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-black hover:text-white bg-brand hover:bg-brand/90 border border-slate-200/80 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          กลับหน้าหลัก
        </Link>
      </header>

      {/* พื้นที่เนื้อหาหลัก */}
      <main className="max-w-6xl w-full mx-auto px-6 md:px-10 py-10 flex flex-col gap-10">
        {/* หัวข้อ + ป้ายสถานะบัญชี */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            เลือกร้านของตัวเอง
          </h1>

          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
            บัญชีพร้อมใช้งาน ({stores.length} ร้าน)
          </span>
        </div>

        {stores.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            บัญชีนี้ยังไม่มีร้านค้าที่ผูกอยู่ กรุณาติดต่อผู้จัดงานเพื่อเพิ่มสิทธิ์ร้านค้า
          </div>
        ) : (
          /* ตารางการ์ดร้านค้า 3 คอลัมน์ */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-12 pt-2">
            {stores.map((store) => {
              const image = store.productImage ?? store.image;
              const imageAlt = store.productImage
                ? store.product?.title ?? store.name
                : store.name;

              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => onSelect(store)}
                  className="group flex flex-col items-center gap-4 focus:outline-none cursor-pointer"
                >
                  {/* กล่องรูปอาหารหรือรูปหน้าร้าน */}
                  <div className="w-full aspect-[4/3] bg-[#d9d9d9] group-hover:bg-slate-300 group-hover:ring-2 group-hover:ring-brand/60 transition-all rounded-sm flex flex-col items-center justify-center relative overflow-hidden">
                    {image ? (
                      <img
                        src={image}
                        alt={imageAlt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="size-10 text-slate-400/70 group-hover:scale-110 transition-transform" />
                    )}
                  </div>

                  {/* ชื่อร้านค้าตรงกลางด้านล่าง */}
                  <div className="text-center">
                    <div className="text-base font-bold text-slate-900 group-hover:text-brand transition-colors">
                      {store.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {store.code} · {store.location}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}