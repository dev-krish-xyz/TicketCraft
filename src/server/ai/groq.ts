import type { AIProvider, AnalysisResult, DuplicateResult } from "./provider";
import { buildAnalyzePrompt } from "./prompts/analyze-signal";
import { buildDeduplicatePrompt } from "./prompts/deduplicate";

export class GroqProvider implements AIProvider {
  name = "groq" as const;
  model = "llama-3.3-70b-versatile";
  private apiKey: string;
  private baseUrl = "https://api.groq.com/openai/v1/chat/completions";

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY!;
  }

  private async complete(prompt: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async analyzeSignal(signalContent: string): Promise<AnalysisResult> {
    const text = await this.complete(buildAnalyzePrompt(signalContent));
    return JSON.parse(text) as AnalysisResult;
  }

  async checkDuplicate(
    signalContent: string,
    existingTickets: { id: string; title: string; description: string }[]
  ): Promise<DuplicateResult> {
    const text = await this.complete(
      buildDeduplicatePrompt(signalContent, existingTickets)
    );
    return JSON.parse(text) as DuplicateResult;
  }
}
