import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();

  return {
    title: t("auth.registerTitle"),
    description: t("auth.registerDescription"),
  };
}

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
