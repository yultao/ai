export interface ModelContext {
  prompt: string;
  file?: {
    path: string;
    content: string;
  };
  metadata?: Record<string, any>;
}

export interface PlanStep {
  type: string;
  input: string;
}

export interface MCPMessage {
  type: "text";
  content: string;
}

export interface MCPAgent {
  plan(context: ModelContext): Promise<PlanStep[]>;
  act(step: PlanStep): Promise<string>;
  respond(result: string): Promise<MCPMessage>;
}