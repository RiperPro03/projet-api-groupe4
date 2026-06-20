import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";

import AppShell from "@/components/AppShell";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import ReduxProvider from "@/components/providers/ReduxProvider";
import { I18nProvider } from "@/lib/i18n/client";
import { getLanguage } from "@/lib/i18n/config";
import { getServerLocale } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/current-user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Breezyl",
  description: "Rejoignez la communauté Breezyl.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, locale] = await Promise.all([
    getCurrentUser().catch(() => null),
    getServerLocale(),
  ]);
  const language = getLanguage(locale);

  return (
    <html
      lang={locale}
      dir={language.dir}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className="min-h-full flex flex-col">
        <MantineProvider defaultColorScheme="dark">
          <ReduxProvider>
            <I18nProvider initialLocale={locale}>
              <NotificationProvider>
                <AppShell currentUser={currentUser}>{children}</AppShell>
              </NotificationProvider>
            </I18nProvider>
          </ReduxProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
