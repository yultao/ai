import { MCPAgent, ModelContext, PlanStep, MCPMessage } from "../types";
import { callLLM } from "../model/provider.js";

export class MyAgent implements MCPAgent {
  async plan(context: ModelContext): Promise<PlanStep[]> {
    return [{ type: "llm", input: context.prompt }];
  }

  async act(step: PlanStep): Promise<string> {
    return callLLM(step.input);
  }

  async respond(result: string): Promise<MCPMessage> {
    return { type: "text", content: result };
  }
}