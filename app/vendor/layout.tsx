import { Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { AppSidebar } from "@/components/vendor/app-sidebar";
import { VendorStoreProvider } from "@/components/vendor/vendor-store-context";
import { requirePageUser } from "@/server/auth/page-user";
import { getMyStore } from "@/server/services/store.service";
import { notFound } from "next/navigation";

async function VendorStoreLoader({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("/vendor");

  // ดึง storeId ทั้งหมดที่ผูกกับบัญชีผู้ใช้คนนี้จากฐานข้อมูล
  const storeIds = Array.from(
    new Set(
      user.userRoles
        .map((role) => role.storeId)
        .filter((id): id is string => Boolean(id))
    )
  );

  // เรียก getMyStore จาก store.service.ts เพื่อดึงข้อมูลร้านค้าจริงทั้งหมดของ user คนนี้
  const stores = await Promise.all(
    storeIds.map((storeId) => getMyStore(user, storeId))
  );
  console.log (stores)
  if (stores.length===0) notFound()

  return (
    <VendorStoreProvider initialStores={stores}>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className="w-full bg-white border-b border-slate-100 h-14 px-4 flex items-center justify-between">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </SidebarProvider>
    </VendorStoreProvider>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-dvh flex items-center justify-center py-4">
          <Spinner className="size-8 text-brand" />
        </div>
      }
    >
      <VendorStoreLoader>{children}</VendorStoreLoader>
    </Suspense>
  );
}