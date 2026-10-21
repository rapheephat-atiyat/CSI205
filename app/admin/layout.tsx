import AdminNav from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b p-4 md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <p className="mb-4 px-3 text-lg font-semibold">TUATUA Admin</p>
        <AdminNav />
      </aside>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
