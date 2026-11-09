import AccBreadCrumb from "@/app/(main)/account/AccBreadCrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, Suspense } from "react";

function BreadcrumbSkeleton() {
    return <Skeleton className="h-5 w-48 rounded-md" />;
}

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <main className="outline outline-red-500 max-w-7xl mx-auto w-full pt-8 px-10 pb-20">
            <Suspense fallback={<BreadcrumbSkeleton />}>
                <div className="flex flex-row gap-8">
                    <aside className="w-84 sticky outline outline-red-500 top-[calc(var(--navbar-height)+2rem)] shrink-0 self-start">
                        <AccBreadCrumb />
                    </aside>
                    <section className="flex-1 outline outline-green-500">
                        {children}
                    </section>
                </div>
            </Suspense>

        </main >
    );
}