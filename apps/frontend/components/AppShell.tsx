"use client";

import { usePathname } from "next/navigation";
import ChatPresenceClient from "@/components/chat/ChatPresenceClient";
import Navbar from "@/components/Navbar";
import { Particles } from "@/components/ui/particles";
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
      <ChatPresenceClient currentUserId={currentUser?.auth.id ?? null} />
      <Navbar currentUser={currentUser} />
      <main className="relative flex-1 overflow-hidden bg-background pb-16 md:pb-0 md:pl-20">
        <Particles
          className="fixed z-0"
          quantity={240}
          color="var(--foreground)"
          size={1.1}
          speed={0.3}
        />
        <div className="relative z-10">{children}</div>
      </main>
    </>
  );
}
