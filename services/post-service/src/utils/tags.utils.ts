/**
 * Extrait les hashtags d'un contenu texte.
 * Ex: "Hello #world et #TypeScript !" → ["world", "typescript"]
 *
 * Règles :
 * - commence par #
 * - lettres, chiffres, underscores uniquement (pas de ponctuation)
 * - longueur min 1 caractère après le #
 * - normalisé en lowercase
 * - doublons supprimés
 */
export function extractHashtags(content: string): string[] {
    const matches = content.match(/#([a-zA-Z0-9_]+)/g) ?? [];
    const tags = matches.map((tag) => tag.slice(1).toLowerCase());
    return Array.from(new Set(tags));
}

/**
 * Fusionne les hashtags extraits du contenu avec les tags explicites fournis,
 * sans doublons et en lowercase.
 */
export function mergeTagsWithHashtags(
    content: string,
    explicitTags: string[] = []
): string[] {
    const fromContent = extractHashtags(content);
    const normalized = explicitTags.map((t) => t.toLowerCase().trim()).filter(Boolean);
    return Array.from(new Set([...normalized, ...fromContent]));
}