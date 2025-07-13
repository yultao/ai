console.log("Hello, TypeScript with Node.js!");
// src/index.ts

import { createModel } from "./modelFactory.js";
// import { HumanMessage } from "langchain/schema/message";

async function main() {
  const model = createModel();

  const res = await model.invoke("用一句话描述春天");

  console.log("💬 模型输出:", res.text);
}

main().catch(console.error);
