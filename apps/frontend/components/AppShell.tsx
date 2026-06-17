"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import type { CurrentUser } from "@/lib/current-user";

const AUTH_ROUTES = ["/login", "/register"];

export default function AppShell({
  children,
  currentUser,
}: Readonly<{
  children: React.ReactNode;
  currentUser: CurrentUser | null;
}>) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute) {
    return children;
  }

  return (
    <>
      <ScrollProgress className="z-[60] h-1 bg-linear-to-r from-breezy-green via-breezy-yellow to-breezy-green md:left-20" />
      <Navbar currentUser={currentUser} />
      <main className="flex-1 pb-16 md:pb-0 md:pl-20">{children}</main>
    </>
  );
}
