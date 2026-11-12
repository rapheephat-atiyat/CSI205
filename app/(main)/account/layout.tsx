import AccBreadCrumb, { AccountLinks } from "@/app/(main)/account/AccBreadCrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode, Suspense } from "react";

function BreadcrumbSkeleton() {
    return <Skeleton className="h-5 w-48 rounded-md" />;
}

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <main className="mx-auto w-full max-w-6xl space-y-5 px-4 pt-6 pb-12 sm:px-6 sm:pt-8 lg:px-10">
            <Suspense fallback={<BreadcrumbSkeleton />}><AccBreadCrumb /></Suspense>
            <div className="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
                <aside className="self-start lg:sticky lg:top-[calc(var(--navbar-height)+1.5rem)]">
                    <Suspense>
                        <AccountLinks />
                    </Suspense>
                </aside>
                <section className="min-w-0">
                    {children}
                </section>
            </div>
        </main>
    );
}
