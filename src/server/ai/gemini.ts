import { GoogleGenAI } from "@google/genai";
import type { AIProvider, AnalysisResult, DuplicateResult } from "./provider";
import { buildAnalyzePrompt } from "./prompts/analyze-signal";
import { buildDeduplicatePrompt } from "./prompts/deduplicate";

export class GeminiProvider implements AIProvider {
  name = "gemini" as const;
  model = "gemini-2.0-flash";
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    });
  }

  async analyzeSignal(signalContent: string): Promise<AnalysisResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildAnalyzePrompt(signalContent),
    });

    const text = response.text ?? "";
    return JSON.parse(text) as AnalysisResult;
  }

  async checkDuplicate(
    signalContent: string,
    existingTickets: { id: string; title: string; description: string }[]
  ): Promise<DuplicateResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: buildDeduplicatePrompt(signalContent, existingTickets),
    });

    const text = response.text ?? "";
    return JSON.parse(text) as DuplicateResult;
  }
}
