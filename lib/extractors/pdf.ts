export async function extractPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with Next.js edge runtime
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}
