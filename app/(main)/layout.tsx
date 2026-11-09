import Footer from "@/components/layout/Footer";
import Navabr from "@/components/layout/Navabr";
import Brand from "@/components/core/Brand";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

function NavbarFallback() {
    return (
        <header aria-busy="true" aria-label="กำลังโหลดเมนู" className="sticky top-0 z-49 h-(--navbar-height) w-full shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-2xl">
            <div className="mx-auto flex size-full max-w-7xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6 lg:gap-6 lg:px-10">
                <Brand priority />
                <Skeleton aria-hidden="true" className="hidden h-5 w-64 motion-reduce:animate-none lg:block" />
                <Skeleton aria-hidden="true" className="h-11 w-24 rounded-lg motion-reduce:animate-none lg:w-56" />
            </div>
        </header>
    );
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={<NavbarFallback />}>
                <Navabr />
            </Suspense>
            {children}
            <Footer />
        </>
    );
}
