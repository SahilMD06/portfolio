/**
 * Presentation helpers shared by the public sections.
 *
 * These only reshape content that already exists in the database for display —
 * splitting, counting, formatting. They never invent facts.
 */

/** Research roles get their own section instead of sitting in the timeline. */
export function isResearch(item: { employmentType: string }): boolean {
  return item.employmentType.trim().toLowerCase() === 'research';
}

/**
 * Splits a role like "Student Researcher — Explainable Multimodal AI for …"
 * into its title and topic, so the topic can lead the research section.
 */
export function splitRole(role: string): { title: string; topic: string | null } {
  const [title, ...rest] = role.split(/\s+[—–-]\s+/);
  const topic = rest.join(' — ').trim();
  return { title: (title ?? role).trim(), topic: topic || null };
}

/**
 * Pulls a headline number out of a grade such as "CGPA 9.52 / 10" or "84%".
 * Returns null when the grade has no number to feature.
 */
export function gradeStat(grade: string | null | undefined): {
  value: string;
  suffix: string;
  label: string;
} | null {
  if (!grade) return null;
  const match = grade.match(/([\d.]+)\s*(\/\s*[\d.]+|%)?/);
  if (!match?.[1]) return null;
  const label = grade.replace(match[0], '').trim() || 'Grade';
  return { value: match[1], suffix: (match[2] ?? '').replace(/\s+/g, ' '), label };
}

/** "AI/ML Engineering · Generative & Agentic AI" -> ["AI/ML Engineering", …]. */
export function splitDotList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\s*[·•|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** "01", "02", … for section and card numbering. */
export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * A stable pseudo-random position for a project's placeholder glow, derived
 * from its slug, so each card looks distinct without any stored artwork.
 */
export function glowPosition(seed: string): { x: number; y: number } {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const x = 20 + ((hash >>> 0) % 60);
  const y = 15 + ((hash >>> 8) % 55);
  return { x, y };
}

/** "https://www.linkedin.com/in/name/" -> "linkedin.com/in/name". */
export function displayUrl(url: string): string {
  if (/^mailto:/i.test(url)) return url.replace(/^mailto:/i, '').split('?')[0] ?? url;
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}
