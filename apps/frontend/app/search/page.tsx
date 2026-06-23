"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, Card, Group, Stack, Text } from "@mantine/core";
import { FiSearch, FiUser, FiX } from "react-icons/fi";
import { ShineBorder } from "@/components/ui/shine-border";
import {
  searchProfilesByUsername,
  type PublicProfile,
} from "@/lib/api/profile.service";
import { useI18n } from "@/lib/i18n/client";

const fieldContainerClassName =
  "group relative overflow-hidden rounded-xl border border-transparent bg-background shadow-lg shadow-black/20 transition-shadow focus-within:shadow-[0_0_1.25rem_rgb(var(--breezy-green-rgb)_/_0.28)]";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="size-11 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-1/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profiles = await searchProfilesByUsername(q.trim());
      setResults(profiles);
      setSearched(true);
    } catch {
      setError(t("search.loadError"));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void doSearch(debouncedQuery);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [debouncedQuery, doSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <section className="min-h-[calc(100svh-64px)] bg-transparent px-4 py-8 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-xl">
        <Text
          component="h1"
          fw={700}
          size="xl"
          mb="lg"
          style={{ color: "var(--foreground)" }}
        >
          {t("search.title")}
        </Text>

        {/* Barre de recherche */}
        <div className={`${fieldContainerClassName} mb-6`}>
          <ShineBorder
            borderWidth="0.125rem"
            duration={15}
            shineColor={[
              "var(--color-breezy-green)",
              "var(--color-breezy-yellow)",
              "var(--color-breezy-green)",
            ]}
            className="z-20"
          />
          <div className="relative z-10 flex items-center rounded-[inherit] bg-background">
            <span className="pointer-events-none absolute left-4 text-muted-foreground">
              <FiSearch className="h-5 w-5" aria-hidden />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.inputAria")}
              className="search-input w-full rounded-xl bg-transparent py-3 pl-11 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={clearSearch}
                aria-label={t("search.clear")}
                className="absolute right-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chargement */}
        {loading && (
          <Stack gap="sm">
            <ProfileSkeleton />
            <ProfileSkeleton />
            <ProfileSkeleton />
          </Stack>
        )}

        {/* Erreur */}
        {error && !loading && (
          <Card
            radius={8}
            p="md"
            withBorder
            style={{ borderColor: "var(--destructive)" }}
          >
            <Text size="sm" style={{ color: "var(--destructive)" }}>
              {error}
            </Text>
          </Card>
        )}

        {/* Aucun résultat */}
        {!loading && !error && searched && results.length === 0 && (
          <Stack align="center" gap="xs" py={64}>
            <FiUser
              className="h-10 w-10 opacity-30"
              style={{ color: "var(--muted-foreground)" }}
              aria-hidden
            />
            <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
              {t("search.noResults", { query })}
            </Text>
          </Stack>
        )}

        {/* Résultats */}
        {!loading && !error && results.length > 0 && (
          <Stack gap="sm" role="list" aria-label={t("search.title")}>
            {results.map((profile) => {
              const displayName = profile.nickname || profile.username;
              return (
                <div key={profile.id_user} role="listitem">
                  <Link
                    href={`/profile/${encodeURIComponent(profile.username)}`}
                    className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-breezy-green"
                  >
                    <Card
                      radius={8}
                      p="md"
                      withBorder
                      bg="var(--card)"
                      className="transition-colors hover:border-[rgb(var(--breezy-green-rgb)_/_0.5)] hover:bg-accent"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Group gap="sm" wrap="nowrap">
                        <Avatar
                          src={profile.url_photo || null}
                          alt={displayName}
                          radius="xl"
                          size={44}
                          color="green"
                        >
                          {displayName.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                          <Text
                            fw={700}
                            size="sm"
                            truncate
                            style={{ color: "var(--foreground)" }}
                          >
                            {displayName}
                          </Text>
                          <Text
                            size="sm"
                            truncate
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            @{profile.username}
                          </Text>
                          {profile.bio && (
                            <Text
                              size="xs"
                              truncate
                              mt={2}
                              style={{
                                color: "var(--muted-foreground)",
                                opacity: 0.7,
                              }}
                            >
                              {profile.bio}
                            </Text>
                          )}
                        </Stack>
                      </Group>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </Stack>
        )}

        {/* État initial */}
        {!query && !searched && (
          <Stack align="center" gap="xs" py={80}>
            <FiSearch
              className="h-12 w-12 opacity-20"
              style={{ color: "var(--muted-foreground)" }}
              aria-hidden
            />
            <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
              {t("search.initial")}
            </Text>
          </Stack>
        )}
      </div>
    </section>
  );
}
