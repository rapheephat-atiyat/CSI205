import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/vendor/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 p-6">
        <SidebarTrigger />
        
          {children}
<<<<<<< Updated upstream
        
=======
        </div>

        <div className="grid grid-cols-[3fr_1fr_1fr] gap-4 text-sm text-gray-400 border-b border-gray-100 pb-3 px-4 mb-4">
        <div>สินค้า</div>
        <div className="text-center">ราคา</div>
        <div className="text-right">สถานะ</div>
      </div>
>>>>>>> Stashed changes
      </main>
    </SidebarProvider>
  )
}