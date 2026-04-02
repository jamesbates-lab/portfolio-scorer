import { NextRequest, NextResponse } from "next/server";
import { extractPdf } from "@/lib/extractors/pdf";
import { extractUrl } from "@/lib/extractors/url";
import { extractFigma } from "@/lib/extractors/figma";
import { normalizeContent } from "@/lib/normalize";
import { scorePortfolio } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let rawContent = "";
    let inputLabel = "";

    if (contentType.includes("multipart/form-data")) {
      // PDF upload
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }

      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are supported." },
          { status: 400 }
        );
      }

      const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10 MB." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      rawContent = await extractPdf(buffer);
      inputLabel = file.name;
    } else {
      // JSON body with url or figmaUrl
      let body: { url?: string; figmaUrl?: string };
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid request body." },
          { status: 400 }
        );
      }

      if (body.figmaUrl) {
        const figmaUrl = body.figmaUrl.trim();
        if (!figmaUrl.includes("figma.com")) {
          return NextResponse.json(
            { error: "Invalid Figma URL. Must be a figma.com link." },
            { status: 400 }
          );
        }
        rawContent = await extractFigma(figmaUrl);
        inputLabel = figmaUrl;
      } else if (body.url) {
        const url = body.url.trim();
        try {
          new URL(url);
        } catch {
          return NextResponse.json(
            { error: "Invalid URL. Please enter a valid https:// URL." },
            { status: 400 }
          );
        }
        rawContent = await extractUrl(url);
        inputLabel = url;
      } else {
        return NextResponse.json(
          { error: "Provide a url, figmaUrl, or PDF file." },
          { status: 400 }
        );
      }
    }

    if (!rawContent.trim() || rawContent.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Not enough content could be extracted. The portfolio may be image-only or behind authentication.",
        },
        { status: 422 }
      );
    }

    const normalized = normalizeContent(rawContent);
    const result = await scorePortfolio(normalized);

    return NextResponse.json({ result, inputLabel });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    console.error("[/api/score] Error:", message, err);

    // Surface API key issues clearly
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not set. Add it to your environment variables." },
        { status: 500 }
      );
    }

    // Surface Anthropic auth errors
    if (
      message.includes("401") ||
      message.includes("403") ||
      message.includes("auth") ||
      message.includes("API key") ||
      message.includes("invalid_api_key")
    ) {
      return NextResponse.json(
        { error: "Anthropic API key is invalid or unauthorized. Check your ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const isKnownError =
      err instanceof Error &&
      (message.includes("Figma") ||
        message.includes("fetch") ||
        message.includes("PDF") ||
        message.includes("URL") ||
        message.includes("FIGMA_API_KEY") ||
        message.includes("content"));

    return NextResponse.json(
      {
        error: isKnownError
          ? message
          : `Error: ${message}`,
      },
      { status: 500 }
    );
  }
}
