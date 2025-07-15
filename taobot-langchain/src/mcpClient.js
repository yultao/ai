import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { modelConfigs } from "../dist/config.js";
import { createModel } from "../dist/modelFactory.js";

// Create client and connect to server
const client = new MultiServerMCPClient({
  // Global tool configuration options
  // Whether to throw on errors if a tool fails to load (optional, default: true)
  throwOnLoadError: true,
  // Whether to prefix tool names with the server name (optional, default: true)
  prefixToolNameWithServerName: true,
  // Optional additional prefix for tool names (optional, default: "mcp")
  additionalToolNamePrefix: "mcp",

  // Use standardized content block format in tool outputs
  useStandardContentBlocks: true,

  // Server configuration
  mcpServers: {
    "slack-mcp": {
      "disabled": false,
      "command": "node",
      "args": [
        "C:/Workspace/ai/slack-mcp-server/dist/index.js"
      ]
    },
  },
});

const tools = await client.getTools();
console.log("tools: " + JSON.stringify(tools));

// Create an OpenAI model
const model = createModel(modelConfigs["creative"]);
// Create the React agent
const agent = createReactAgent({
  llm: model,
  tools,
});

// Run the agent
try {
  const mathResponse = await agent.invoke({
    messages: [{ role: "user", content: "show my slack channels" }],
  });
  console.log("invoke: " + JSON.stringify(mathResponse));


  // const steps = await agent.stream({ input: "show my slack channels" });

  // for await (const step of steps) {
  //   if (step.log) {
  //     console.log("📘 Reasoning:\n", step.log);
  //   }

  //   if (step.action) {
  //     console.log("🛠 Calling tool:", step.action.tool);
  //     console.log("With input:", step.action.toolInput);
  //   }

  //   if (step.observation) {
  //     console.log("👁 Tool returned:", step.observation);
  //   }

  //   if (step.output) {
  //     console.log("✅ Final answer:", step.output);
  //   }
  // }
} catch (error) {
  console.error("Error during agent execution:", error);
  // Tools throw ToolException for tool-specific errors
  if (error.name === "ToolException") {
    console.error("Tool execution failed:", error.message);
  }
}

await client.close();