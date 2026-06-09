"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

const AUTH_ROUTES = ["/login", "/register"];

export default function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute) {
    return children;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0 md:pl-20">{children}</main>
    </>
  );
}
