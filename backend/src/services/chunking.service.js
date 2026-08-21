import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 800);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 120);


export async function chunkText(rawText) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const chunks = await splitter.splitText(rawText);
  return chunks.map((text) => text.trim()).filter((text) => text.length > 0);
}
