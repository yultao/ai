import fs from "fs/promises";
import { ModelContext } from "../types";

export async function buildContext(prompt: string, filePath: string): Promise<ModelContext> {
  const content = await fs.readFile(filePath, "utf-8");
  return {
    prompt,
    file: {
      path: filePath,
      content,
    },
    metadata: {
      createdAt: new Date().toISOString(),
    }
  };
}