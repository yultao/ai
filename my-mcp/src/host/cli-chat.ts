import { createInterface } from "readline/promises";
import fs from "fs/promises";
import { MyAgent } from "../agent/MyAgent.js";

// 载入 agent 源码（或你要分析的代码）
const codeFilePath = "./agent/MyAgent.ts";
let fileContent = "";

const contextHistory: string[] = [];

async function main() {
  try {
    fileContent = await fs.readFile(codeFilePath, "utf-8");
  } catch (err) {
    console.error(`❌ 读取文件失败: ${codeFilePath}`);
    process.exit(1);
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("💬 欢迎使用 MCP CLI 聊天。输入 exit 可退出。\n");

  const agent = new MyAgent();

  while (true) {
    const userInput = await rl.question("🧑 你: ");

    if (userInput.trim().toLowerCase() === "exit") {
      rl.close();
      break;
    }

    contextHistory.push(`用户: ${userInput}`);

    const context = {
      prompt: contextHistory.join("\n"),
      file: {
        path: codeFilePath,
        content: fileContent,
      },
      metadata: {},
    };

    try {
      const plan = await agent.plan(context);
      const result = await agent.act(plan[0]);
      const response = await agent.respond(result);

      const reply = response.content ?? "(无响应)";
      contextHistory.push(`AI: ${reply}`);
      console.log(`🤖 AI: ${reply}\n`);
    } catch (err) {
      console.error("❌ 出错了：", err);
    }
  }
}

main();
