import * as cheerio from "cheerio";

export async function extractUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PortfolioScorer/1.0; +https://portfolioscorer.app)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error("URL does not point to an HTML page.");
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    "script, style, noscript, nav, footer, header, aside, iframe, svg, [role='banner'], [role='navigation'], [aria-hidden='true']"
  ).remove();

  // Try to find main content
  const contentSelectors = [
    "main",
    "article",
    '[role="main"]',
    ".content",
    "#content",
    ".portfolio",
    "#portfolio",
    ".case-study",
    ".work",
    "#work",
  ];

  let text = "";
  for (const selector of contentSelectors) {
    const el = $(selector);
    if (el.length > 0) {
      text = el.text();
      break;
    }
  }

  // Fall back to body
  if (!text.trim()) {
    text = $("body").text();
  }

  // Normalize whitespace
  return text.replace(/\s+/g, " ").trim();
}
