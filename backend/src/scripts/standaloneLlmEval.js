import fs from "fs";
import path from "path";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODEL =
  process.env.GEMINI_CHAT_MODEL || "gemini-3.6-flash";

const inputArg = process.argv.find((arg) =>
  arg.startsWith("--input=")
);

if (!inputArg) {
  console.error(
    "Usage: node src/scripts/standaloneLlmEval.js --input=eval/ground-truth-12.json"
  );
  process.exit(1);
}

const inputPath = inputArg.split("=")[1];

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  const questions = JSON.parse(
    fs.readFileSync(inputPath, "utf8")
  );

  console.log(`Running standalone LLM evaluation`);
  console.log(`Model: ${MODEL}`);
  console.log(`Queries: ${questions.length}`);
  console.log(`Retrieval: DISABLED\n`);

  const results = [];

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];

    console.log(
      `[${i + 1}/${questions.length}] ${item.query}`
    );

    try {
      const start = Date.now();
      const model = genAI.getGenerativeModel({ model: MODEL });

      const result = await model.generateContent(item.query);

      const elapsedMs = Date.now() - start;

      const answer = result.response.text();

      results.push({
        queryNumber: i + 1,
        query: item.query,
        relevantChunkIds: item.relevantChunkIds,
        standaloneResponse: answer,
        responseTimeMs: elapsedMs,
        model: MODEL,
      });

      console.log(`Completed in ${elapsedMs} ms\n`);
    } catch (error) {
      console.error(`Failed: ${error.message}\n`);

      results.push({
        queryNumber: i + 1,
        query: item.query,
        relevantChunkIds: item.relevantChunkIds,
        standaloneResponse: null,
        error: error.message,
        model: MODEL,
      });
    }
  }

  const outputDir = path.join(
    process.cwd(),
    "eval",
    "results"
  );

  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(
    outputDir,
    "standalone-llm-results.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(results, null, 2)
  );

  console.log("--------------------------------");
  console.log("Standalone evaluation complete");
  console.log(`Results saved to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
