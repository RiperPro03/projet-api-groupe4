"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiBell, FiHome, FiSearch, FiUser } from "react-icons/fi";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import { ThemedLogo } from "@/components/branding/ThemedLogo";
import { useI18n } from "@/lib/i18n/client";
import type { CurrentUser } from "@/lib/current-user";

export default function Navbar({
    currentUser,
}: {
    currentUser: CurrentUser | null;
}) {
    const pathname = usePathname();
    const { t } = useI18n();
    const [logoAnimationKey, setLogoAnimationKey] = useState(0);
    const profileName =
        currentUser?.profile?.nickname ||
        currentUser?.profile?.username ||
        currentUser?.auth.email.split("@")[0] ||
        "";
    const profileInitials = profileName.slice(0, 2).toUpperCase();
    const profilePhoto = currentUser?.profile?.url_photo;

    const links = [
        { href: "/", label: t("nav.home"), icon: FiHome },
        { href: "/search", label: t("nav.search"), icon: FiSearch },
        { href: "/notif", label: t("nav.notifications"), icon: FiBell },
        { href: "/profile", label: t("nav.profile"), icon: FiUser },
    ];

    return (
        <nav
            className="group fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-20 md:overflow-hidden md:border-r md:border-t-0 md:pb-0 md:transition-[width] md:duration-300 md:ease-out md:hover:w-64"
            onMouseEnter={() => setLogoAnimationKey((key) => key + 1)}
        >
            <div className="mx-auto flex h-16 max-w-md items-center justify-center px-2 md:mx-0 md:h-full md:max-w-none md:flex-col md:items-stretch md:justify-start md:gap-2 md:p-4">
                <Link
                    href="/"
                    className="mb-4 hidden h-fit items-center whitespace-nowrap rounded-xl px-1 py-1 text-2xl font-bold text-breezy-green hover:bg-accent md:flex"
                    aria-label={t("nav.brandHome")}
                >
                    <ThemedLogo
                        size={40}
                        className="size-10 shrink-0 rounded-lg object-cover"
                    />
                    <DiaTextReveal
                        key={logoAnimationKey}
                        className="ml-4 inline-block py-1 text-3xl font-bold leading-normal tracking-tight opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        colors={[
                            "var(--color-breezy-green)",
                            "var(--color-breezy-yellow)",
                            "var(--color-breezy-green)",
                        ]}
                        textColor="var(--foreground)"
                        text="Breezyl"
                    />
                </Link>

                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = href === "/"
                        ? pathname === href
                        : pathname.startsWith(href);

                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-label={label}
                            aria-current={isActive ? "page" : undefined}
                            title={label}
                            className={`flex flex-1 items-center justify-center rounded-full p-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-breezy-yellow md:h-12 md:flex-none md:justify-start md:px-3 md:text-xl ${
                                isActive
                                    ? "font-semibold text-breezy-green hover:text-breezy-green"
                                    : "text-foreground hover:text-breezy-yellow"
                            }`}
                        >
                            <span className="flex w-6 shrink-0 justify-center">
                                {href === "/profile" && currentUser ? (
                                    <span
                                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-breezy-green bg-cover bg-center text-xs font-bold text-black"
                                        style={
                                            profilePhoto
                                                ? { backgroundImage: `url(${profilePhoto})` }
                                                : undefined
                                        }
                                        aria-hidden="true"
                                    >
                                        {!profilePhoto && profileInitials}
                                    </span>
                                ) : (
                                    <Icon className="h-6 w-6" aria-hidden="true" />
                                )}
                            </span>
                            <span className="ml-5 hidden whitespace-nowrap opacity-0 transition-opacity duration-300 md:inline group-hover:opacity-100">
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
