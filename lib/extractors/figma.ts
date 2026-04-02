interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string;
}

interface FigmaFile {
  name: string;
  document: FigmaNode;
}

function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } {
  // Figma URL formats:
  // https://www.figma.com/file/KEY/Name
  // https://www.figma.com/design/KEY/Name
  // https://www.figma.com/proto/KEY/Name
  const match = url.match(
    /figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/
  );
  if (!match) {
    throw new Error(
      "Invalid Figma URL. Expected format: https://www.figma.com/file/KEY/..."
    );
  }

  const nodeMatch = url.match(/node-id=([^&]+)/);
  return {
    fileKey: match[1],
    nodeId: nodeMatch ? decodeURIComponent(nodeMatch[1]) : undefined,
  };
}

function extractText(node: FigmaNode, depth = 0): string[] {
  const lines: string[] = [];

  const indent = "  ".repeat(Math.min(depth, 4));

  if (node.type === "DOCUMENT") {
    lines.push(`Document: ${node.name}`);
  } else if (node.type === "CANVAS") {
    lines.push(`\nPage: ${node.name}`);
  } else if (["FRAME", "COMPONENT", "SECTION"].includes(node.type)) {
    if (depth <= 3) {
      lines.push(`${indent}Frame: ${node.name}`);
    }
  } else if (node.type === "TEXT" && node.characters) {
    const text = node.characters.trim();
    if (text) {
      lines.push(`${indent}${text}`);
    }
  }

  if (node.children) {
    for (const child of node.children) {
      lines.push(...extractText(child, depth + 1));
    }
  }

  return lines;
}

export async function extractFigma(figmaUrl: string): Promise<string> {
  const apiKey = process.env.FIGMA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FIGMA_API_KEY environment variable is not set. Please add it to your .env.local file."
    );
  }

  const { fileKey } = parseFigmaUrl(figmaUrl);

  const response = await fetch(
    `https://api.figma.com/v1/files/${fileKey}?depth=5`,
    {
      headers: {
        "X-Figma-Token": apiKey,
      },
      signal: AbortSignal.timeout(20000),
    }
  );

  if (response.status === 403) {
    throw new Error(
      "Figma API access denied. Check that your FIGMA_API_KEY has access to this file."
    );
  }
  if (response.status === 404) {
    throw new Error(
      "Figma file not found. Make sure the file is publicly accessible or your API key has access."
    );
  }
  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }

  const data: FigmaFile = await response.json();
  const lines = extractText(data.document);
  const text = lines.filter(Boolean).join("\n");

  if (!text.trim()) {
    throw new Error(
      "No readable content found in the Figma file. Make sure text layers are present."
    );
  }

  return text;
}
