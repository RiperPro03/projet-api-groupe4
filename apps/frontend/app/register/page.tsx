import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte Breezyl.",
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
