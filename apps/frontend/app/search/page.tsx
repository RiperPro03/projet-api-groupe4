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

const fieldContainerClassName =
  "group relative rounded-xl border border-input bg-background transition-shadow focus-within:border-transparent focus-within:shadow-[0_0_1.25rem_rgba(0,146,62,0.28)]";

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
      setError("Impossible de charger les résultats. Réessayez.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doSearch(debouncedQuery);
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
    <section className="min-h-[calc(100svh-64px)] bg-background px-4 py-8 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-xl">
        <Text
          component="h1"
          fw={700}
          size="xl"
          mb="lg"
          style={{ color: "var(--foreground)" }}
        >
          Rechercher
        </Text>

        {/* Barre de recherche */}
        <div className={`${fieldContainerClassName} mb-6`}>
          <ShineBorder
            shineColor={["var(--color-breezy-green)", "var(--color-breezy-yellow)"]}
            duration={8}
          />
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-4 text-muted-foreground">
              <FiSearch className="h-5 w-5" aria-hidden />
            </span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              aria-label="Rechercher un utilisateur par son nom d'utilisateur"
              className="w-full rounded-xl bg-background py-3 pl-11 pr-11 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={clearSearch}
                aria-label="Effacer la recherche"
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
            <Text size="sm" c="red">
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
              Aucun utilisateur trouvé pour{" "}
              <Text component="span" fw={600} style={{ color: "var(--foreground)" }}>
                «&nbsp;{query}&nbsp;»
              </Text>
            </Text>
          </Stack>
        )}

        {/* Résultats */}
        {!loading && !error && results.length > 0 && (
          <Stack gap="sm" role="list" aria-label="Résultats de recherche">
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
                      className="transition-colors hover:border-[rgba(0,146,62,0.5)] hover:bg-accent"
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
              Tapez un nom d&apos;utilisateur pour commencer
            </Text>
          </Stack>
        )}
      </div>
    </section>
  );
}
