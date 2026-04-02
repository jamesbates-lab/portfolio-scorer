export type InputType = "pdf" | "url" | "figma";

export interface ScoreResult {
  overall_score: number;
  recommendation: "hire" | "maybe" | "pass";
  categories: {
    visual_design: number;
    ux_thinking: number;
    case_studies: number;
    product_sense: number;
    communication: number;
  };
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputType: InputType;
  inputLabel: string;
  result: ScoreResult;
}
