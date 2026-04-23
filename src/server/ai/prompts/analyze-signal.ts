export function buildAnalyzePrompt(signalContent: string): string {
  return `You are TicketCraft, an AI that analyzes bug signals and converts them into structured developer tickets.

Analyze the following bug signal and provide a structured analysis.

BUG SIGNAL:
${signalContent}

Respond with ONLY a valid JSON object (no markdown, no code fences) with these exact fields:
{
  "rootCause": "Brief root cause analysis (1-2 sentences)",
  "suggestedTitle": "Clear, concise ticket title (under 100 chars)",
  "suggestedDescription": "Detailed ticket description in Markdown format with: ## Summary, ## Steps to Reproduce (if applicable), ## Expected vs Actual Behavior, ## Technical Details",
  "suggestedPriority": "critical|high|medium|minor",
  "confidence": 0.0 to 1.0,
  "groupKey": "lowercase-kebab-case category for grouping similar issues (e.g., 'payment-timeout', 'auth-failure', 'db-connection')"
}

Priority guidelines:
- critical: Data loss, security vulnerability, complete service outage
- high: Major feature broken, significant user impact, payment issues
- medium: Feature partially broken, workaround exists
- minor: Cosmetic issue, edge case, low user impact`;
}
