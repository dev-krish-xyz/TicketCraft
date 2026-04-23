import { createHash } from "crypto";

/**
 * Normalize signal content for deduplication:
 * - Lowercase
 * - Strip timestamps (ISO 8601, Unix, common log formats)
 * - Strip UUIDs
 * - Collapse whitespace
 * - For stack traces, keep file paths and line numbers only
 */
function normalize(content: string): string {
  return content
    .toLowerCase()
    .replace(/\d{4}-\d{2}-\d{2}[t ]\d{2}:\d{2}:\d{2}[.\d]*(z|[+-]\d{2}:?\d{2})?/g, "")
    .replace(/\b\d{10,13}\b/g, "")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateFingerprint(content: string): string {
  const normalized = normalize(content);
  return createHash("sha256").update(normalized).digest("hex");
}
