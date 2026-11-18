import { Skeleton } from "@/components/ui/skeleton";
import { requirePageUser } from "@/server/auth/page-user";
import { getMe } from "@/server/services/auth.service";
import { Suspense } from "react";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "โปรไฟล์ของฉัน – TUATUA" };

export default function AccountPage() {
    return (
        <Suspense fallback={<ProfileSkeleton />}>
            <ProfileContent />
        </Suspense>
    );
}

async function ProfileContent() {
    const user = await requirePageUser("/account");
    const profile = await getMe(user.id);
    return <ProfileClient profile={profile} />;
}

function ProfileSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <Skeleton className="aspect-square w-full max-w-[200px] rounded-2xl" />
                    <Skeleton className="h-10 w-full max-w-[200px]" />
                </div>
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-11 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
