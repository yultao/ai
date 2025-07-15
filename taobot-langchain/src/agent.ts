import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { modelConfigs } from "./config.js";
import { createModel } from "./modelFactory.js";
import type { DynamicStructuredTool } from "@langchain/core/tools";

// Create client and connect to server
const client = new MultiServerMCPClient({
  throwOnLoadError: true,
  prefixToolNameWithServerName: true,
  additionalToolNamePrefix: "mcp",
  useStandardContentBlocks: true,

  mcpServers: {
    "slack-mcp": {
      command: "node",
      args: [
        "C:/Workspace/ai/slack-mcp-server/dist/index.js",
      ],
    },
  },
});

async function main() {
  const tools: DynamicStructuredTool[] = await client.getTools();
  console.log("tools:", JSON.stringify(tools));

  const model = createModel(modelConfigs["creative"]);

  const agent = createReactAgent({
    llm: model,
    tools,
  });

  try {
    const response = await agent.invoke({
      messages: [{ role: "user", content: "show my slack channels" }],
    });

    console.log("🧠 Final result:", JSON.stringify(response));

    // Optional: stream agent steps
    /*
    const steps = await agent.stream({ input: "show my slack channels" });

    for await (const step of steps as AsyncIterable<AgentStep>) {
      if (step.log) {
        console.log("📘 Reasoning:\n", step.log);
      }

      if (step.action) {
        console.log("🛠 Calling tool:", step.action.tool);
        console.log("With input:", step.action.toolInput);
      }

      if (step.observation) {
        console.log("👁 Tool returned:", step.observation);
      }

      if (step.output) {
        console.log("✅ Final answer:", step.output);
      }
    }
    */
  } catch (error: any) {
    console.error("❌ Error during agent execution:", error);
    if (error.name === "ToolException") {
      console.error("⚠️ Tool execution failed:", error.message);
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
