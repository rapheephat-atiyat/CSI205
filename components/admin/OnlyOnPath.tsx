"use client";

import { usePathname } from "next/navigation";

export default function OnlyOnPath({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return pathname === path ? <>{children}</> : null;
}
