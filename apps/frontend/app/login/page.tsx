import type { Metadata } from "next";
import AuthPage from "@/components/auth/AuthPage";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à Breezyl.",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
