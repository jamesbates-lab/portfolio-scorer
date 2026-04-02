import Anthropic from "@anthropic-ai/sdk";
import type { ScoreResult } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior product design recruiter at a top tech company.

Evaluate the following design portfolio.

Score strictly based on this rubric:
- Visual Design (0–20): Quality of visual craft, hierarchy, typography, color
- UX Thinking (0–20): Evidence of user-centered design thinking and process
- Case Study Depth (0–20): Thoroughness of problem definition, process, and outcomes
- Product Thinking (0–20): Ability to think about business impact and product decisions
- Communication Clarity (0–20): Clear, compelling storytelling about the work

Be critical and realistic. Only the top 10% of candidates should receive "hire".
Most portfolios should receive "maybe" or "pass".

Return ONLY valid JSON with no markdown fences, no extra text. Use exactly this format:
{
  "overall_score": number,
  "recommendation": "hire" | "maybe" | "pass",
  "categories": {
    "visual_design": number,
    "ux_thinking": number,
    "case_studies": number,
    "product_sense": number,
    "communication": number
  },
  "strengths": [string, string, string],
  "weaknesses": [string, string, string],
  "summary": string
}`;

function buildPrompt(content: string): string {
  return `Portfolio content:\n\n${content}`;
}

function extractJson(text: string): ScoreResult {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  const parsed = JSON.parse(cleaned) as ScoreResult;

  // Validate required fields
  if (
    typeof parsed.overall_score !== "number" ||
    !parsed.recommendation ||
    !parsed.categories ||
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.weaknesses) ||
    typeof parsed.summary !== "string"
  ) {
    throw new Error("Response missing required fields");
  }

  // Clamp scores to valid range
  parsed.overall_score = Math.max(0, Math.min(100, parsed.overall_score));
  for (const key of Object.keys(parsed.categories) as Array<
    keyof typeof parsed.categories
  >) {
    parsed.categories[key] = Math.max(0, Math.min(20, parsed.categories[key]));
  }

  return parsed;
}

export async function scorePortfolio(content: string): Promise<ScoreResult> {
  const makeRequest = async (): Promise<string> => {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(content) }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");
    return block.text;
  };

  // First attempt
  let raw = await makeRequest();
  try {
    return extractJson(raw);
  } catch {
    // Retry once with a stronger instruction
    const retryMessage = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        SYSTEM_PROMPT +
        "\n\nCRITICAL: Your previous response could not be parsed as JSON. Return ONLY the raw JSON object with no surrounding text or markdown.",
      messages: [
        { role: "user", content: buildPrompt(content) },
        { role: "assistant", content: raw },
        {
          role: "user",
          content:
            "Your response was not valid JSON. Please return ONLY the JSON object, nothing else.",
        },
      ],
    });
    const retryBlock = retryMessage.content[0];
    if (retryBlock.type !== "text") throw new Error("Unexpected response type");
    raw = retryBlock.text;
    return extractJson(raw);
  }
}
