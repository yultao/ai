// src/index.ts
import { modelConfigs } from "./config.js";
import { createModel } from "./modelFactory.js";
// import { HumanMessage } from "langchain/schema/message";

async function main() {
  const config = modelConfigs["summarize"];
  const model = createModel(config);

  const res = await model.invoke("用一句话描述春天");

  console.log("💬 模型输出:", res.text);

  console.log("================================");

  const stream = await model.stream("用一句话描述春天");

  process.stdout.write("💬 模型输出: ");
  for await (const chunk of stream ) {
    if (typeof chunk.content === "string") {
      process.stdout.write(chunk.content);
    }
  }
  console.log(); // 换行

}

main().catch(console.error);
