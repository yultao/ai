import { buildContext } from "../context/buildContext.js";
import { MyAgent } from "../agent/MyAgent.js";

const prompt = process.argv[2];
const filePath = process.argv[3];

async function run() {
  if (!prompt || !filePath) {
    console.error("Usage: node cli.js <prompt> <filePath>");
    process.exit(1);
  }

  const context = await buildContext(prompt, filePath);
  const agent = new MyAgent();

  const plan = await agent.plan(context);
  const result = await agent.act(plan[0]);
  const response = await agent.respond(result);

  console.log("[Response]");
  console.log(response.content);
}

run();