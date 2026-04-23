export function buildDeduplicatePrompt(
  signalContent: string,
  existingTickets: { id: string; title: string; description: string }[]
): string {
  const ticketList = existingTickets
    .map((t) => `- ID: ${t.id}\n  Title: ${t.title}\n  Description: ${t.description.substring(0, 300)}`)
    .join("\n\n");

  return `You are TicketCraft's deduplication engine. Determine if the following bug signal matches any existing tickets.

NEW BUG SIGNAL:
${signalContent}

EXISTING TICKETS:
${ticketList || "(no existing tickets)"}

Respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "isDuplicate": true or false,
  "matchedTicketId": "the ID of the matching ticket, or null if no match",
  "similarity": 0.0 to 1.0,
  "reason": "Brief explanation of why this is or isn't a duplicate"
}

Consider signals as duplicates if they describe the same underlying issue, even if the wording differs. A similarity above 0.7 should be flagged as duplicate.`;
}
