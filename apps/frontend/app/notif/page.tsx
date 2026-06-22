import type { Metadata } from "next";
import { redirect } from "next/navigation";
import NotificationInbox from "@/components/notifications/NotificationInbox";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Vos notifications Breezyl.",
};

export default async function NotifPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirect=/notif");
  }

  return (
    <section className="min-h-[calc(100svh-64px)] bg-transparent px-4 py-6 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-2xl">
        <NotificationInbox />
      </div>
    </section>
  );
}
