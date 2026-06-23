import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();

  return {
    title: t("auth.loginTitle"),
    description: t("auth.loginDescription"),
  };
}

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
