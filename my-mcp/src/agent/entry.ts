// agent/entry.ts
import { serveAgent, StdioServerTransport } from "@modelcontextprotocol/sdk";
import { MyAgent } from "./MyAgent.js"; // 你自己的 Agent 逻辑

async function main() {
  await serveAgent(new MyAgent(), new StdioServerTransport());
}

main().catch(console.error);
