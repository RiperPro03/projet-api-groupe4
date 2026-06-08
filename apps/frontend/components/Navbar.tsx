"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiBell, FiHome, FiMail, FiSearch, FiUser } from "react-icons/fi";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";

export default function Navbar() {
    const pathname = usePathname();
    const [logoAnimationKey, setLogoAnimationKey] = useState(0);

    const links = [
        { href: "/", label: "Accueil", icon: FiHome },
        { href: "/search", label: "Recherche", icon: FiSearch },
        { href: "/notif", label: "Notifications", icon: FiBell },
        { href: "/msg", label: "Messages", icon: FiMail },
        { href: "/profile", label: "Profil", icon: FiUser },
    ];

    return (
        <nav
            className="group fixed inset-x-0 bottom-0 z-50 border-t border-gray-800 bg-black pb-[env(safe-area-inset-bottom)] backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-20 md:overflow-hidden md:border-r md:border-t-0 md:pb-0 md:transition-[width] md:duration-300 md:ease-out md:hover:w-64"
            onMouseEnter={() => setLogoAnimationKey((key) => key + 1)}
        >
            <div className="mx-auto flex h-16 max-w-md items-center justify-center px-2 md:mx-0 md:h-full md:max-w-none md:flex-col md:items-stretch md:justify-start md:gap-2 md:p-4">
                <Link
                    href="/"
                    className="mb-4 hidden h-12 items-center justify-center overflow-hidden whitespace-nowrap rounded-full px-3 text-2xl font-bold text-green-600 opacity-0 transition-opacity duration-300 hover:bg-white/10 md:flex group-hover:opacity-100"
                    aria-label="Breezyl - Accueil"
                >
                    <DiaTextReveal
                        key={logoAnimationKey}
                        className="text-3xl font-bold tracking-tight"
                        colors={[" #00923E", "#F8C100", "#00923E"]}
                        textColor="white"
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
                            className={`flex flex-1 items-center justify-center rounded-full p-3 transition-colors hover:bg-white/10 hover:text-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 md:h-12 md:flex-none md:justify-start md:px-3 md:text-xl ${
                                isActive ? "font-semibold text-green-500" : "text-white"
                            }`}
                        >
                            <span className="flex w-6 shrink-0 justify-center">
                                <Icon className="h-6 w-6" aria-hidden="true" />
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
