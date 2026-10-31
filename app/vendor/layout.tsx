import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/vendor/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full " >
        <div className="w-full bg-amber-200 h-15">
          <SidebarTrigger />
          </div>
        {children}
        
      </main>
    </SidebarProvider>
  )
}