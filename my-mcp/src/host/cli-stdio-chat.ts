// host/cli-stdio-chat.ts
import { spawn } from "child_process";
import fs from "fs/promises";
import { createInterface } from "readline/promises";
import path from "path";

import { Client } from '@modelcontextprotocol/sdk/client/index';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const agentEntry = "./build/agent/entry.js"; // 编译后的 agent 入口
const codeFile = "./agent/MyAgent.ts";

const contextHistory: string[] = [];

async function main() {
  //
  const child = spawn("node", [agentEntry], {
    stdio: ["pipe", "pipe", "inherit"], // stdin, stdout, stderr
  });

  // const client = await createClientFromStdio(child);
  // 创建 MCP 客户端，绑定子进程的 stdin/stdout


  const transport = new StdioClientTransport({
    command: "node",
    args: ["server.js"]
  });

  const client = new Client(
    {
      name: "example-client",
      version: "1.0.0"
    }
  );

  await client.connect(transport);


  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await fs.readFile(codeFile, "utf-8");

  console.log("💬 MCP STDIO Agent CLI 启动，输入 exit 可退出。\n");

  while (true) {
    const input = await rl.question("🧑 你: ");
    if (input.trim().toLowerCase() === "exit") break;

    // 将用户输入添加到上下文历史
    contextHistory.push(`用户: ${input}`);
    const prompt = contextHistory.join("\n");

    const context = {
      prompt,
      file: {
        path: codeFile,
        content: code,
      },
      metadata: {},
    };

    // 调用计划(plan)阶段
    const plan = await client.plan(context);
    // 取第一个计划项执行行动(act)
    const result = await client.act(plan[0]);
    const reply = await client.respond(result);
    // 获取响应(respond)
    const content = reply.content ?? "(无内容)";

    //将 AI 响应添加到上下文历史
    contextHistory.push(`AI: ${content}`);

    console.log(`🤖 AI: ${content}\n`);
  }

  rl.close();
  child.kill();
}

main();
