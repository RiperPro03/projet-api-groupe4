export function extractHashtags(content: string): string[] {
    const matches = content.match(/#([a-zA-Z0-9_]+)/g) ?? [];
    const tags = matches.map((tag) => tag.slice(1).toLowerCase());

    return Array.from(new Set(tags));
}

export function mergeTagsWithHashtags(
    content: string,
    explicitTags: string[] = []
): string[] {
    const fromContent = extractHashtags(content);
    const normalized = explicitTags
        .map((tag) => tag.toLowerCase().trim().replace(/^#/, ""))
        .filter(Boolean);

    return Array.from(new Set([...normalized, ...fromContent]));
}
