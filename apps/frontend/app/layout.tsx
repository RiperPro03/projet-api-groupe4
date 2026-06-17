import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import "@mantine/core/styles.css";

import AppShell from "@/components/AppShell";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import ReduxProvider from "@/components/providers/ReduxProvider";
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
  const currentUser = await getCurrentUser().catch(() => null);

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className="min-h-full flex flex-col">
        <MantineProvider defaultColorScheme="dark">
          <ReduxProvider>
            <NotificationProvider>
              <AppShell currentUser={currentUser}>{children}</AppShell>
            </NotificationProvider>
          </ReduxProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
