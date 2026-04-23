export interface AnalysisResult {
  rootCause: string;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedPriority: "critical" | "high" | "medium" | "minor";
  confidence: number;
  groupKey: string;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  matchedTicketId: string | null;
  similarity: number;
  reason: string;
}

export interface AIProvider {
  name: "gemini" | "groq" | "ollama";
  model: string;
  analyzeSignal(signalContent: string): Promise<AnalysisResult>;
  checkDuplicate(
    signalContent: string,
    existingTickets: { id: string; title: string; description: string }[]
  ): Promise<DuplicateResult>;
}

let currentProvider: AIProvider | null = null;

export async function getAIProvider(): Promise<AIProvider> {
  if (currentProvider) return currentProvider;

  // Try Groq first if Gemini quota is likely exhausted, then Gemini
  if (process.env.GROQ_API_KEY) {
    const { GroqProvider } = await import("./groq");
    currentProvider = new GroqProvider();
    return currentProvider;
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const { GeminiProvider } = await import("./gemini");
    currentProvider = new GeminiProvider();
    return currentProvider;
  }

  throw new Error(
    "No AI provider configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY."
  );
}

export function resetProvider() {
  currentProvider = null;
}
