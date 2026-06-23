import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/current-user";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [currentUser, { t }] = await Promise.all([
    getCurrentUser(),
    getServerI18n(),
  ]);

  if (!currentUser) {
    redirect("/login?redirect=/admin");
  }

  if (
    !currentUser.user ||
    (currentUser.user.role !== "ADMIN" && currentUser.user.role !== "MODERATOR")
  ) {
    return (
      <section className="min-h-[calc(100svh-64px)] bg-transparent px-4 py-12 text-foreground md:min-h-svh">
        <div className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-6">
          <h1 className="text-xl font-bold">{t("admin.forbiddenTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("admin.forbiddenDescription")}
          </p>
        </div>
      </section>
    );
  }

  return children;
}
