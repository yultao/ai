import * as fs from "fs";
import * as path from "path";

interface McpServerConfig {
  command: string;
  args: string[];
  disabled?: boolean;
}

interface ApiProviderConfig {
  apiKey: string;
  apiBaseURL: string;
  enabled?: boolean;
}

interface EmbeddingConfig {
  model: string;
  apiKey: string;
  apiBaseURL: string;
}
interface ModelConfig {
  name: string;
  description?: string;
  apiProvider?: string;
  enabled?: boolean; // new optional field
}
interface Config {
  // model: string;
  models: { [key: string]: ModelConfig };
  mcpServers: {
    [name: string]: McpServerConfig;
  };
  apiProvider: ApiProviderConfig;
  apiProviders: { [key: string]: ApiProviderConfig };
  embedding: EmbeddingConfig;
}

export interface ServerEntry {
  name: string;
  command: string;
  args: string[];
  disabled: boolean;
}
// interface ApiProviderEntry {
//   apiKey: string;
//   apiBaseURL: string;
// }


export default class AiConfig {
  private static instance: AiConfig;
  private aiConfigPath: string;
  private config: Config;
  private constructor(aiConfigPath: string) {
    this.aiConfigPath = aiConfigPath;
    this.config = this.readConfig();
  }

  public static getInstance(aiConfigPath: string = "ttconfig.json"): AiConfig {
    if (!AiConfig.instance) {
      AiConfig.instance = new AiConfig(aiConfigPath);
    }
    return AiConfig.instance;
  }
  private readConfig(): Config {
    const configPath = path.join(this.aiConfigPath);

    const rawData = fs.readFileSync(configPath, "utf-8");
    const config: Config = JSON.parse(rawData);
    return config;
  }

getEnabledModel(): { name: string; config: any } {
  const config = this.readConfig();

  const entry = Object.entries(config.models).find(
    ([_, model]) => model.enabled === true
  );

  if (!entry) {
    throw new Error("No enabled model found in config.models.");
  }

  const [name, modelConfig] = entry;
  return { name, config: modelConfig };
}

  getEmbeddingConfig(): EmbeddingConfig {
    return this.config.embedding;
  }

getEnabledApiProvider(): { name: string; config: ApiProviderConfig } {
  const config = this.readConfig();

  const entry = Object.entries(config.apiProviders).find(
    ([_, provider]) => provider.enabled === true
  );

  if (!entry) {
    throw new Error("No enabled API provider found.");
  }

  const [name, providerConfig] = entry;
  return { name, config: providerConfig };
}
  getMcpServerConfigs(): ServerEntry[] {
    const servers: ServerEntry[] = Object.entries(this.config.mcpServers).map(
      ([name, { command, args, disabled }]) => ({
        name,
        command,
        args,
        disabled: disabled ?? false,
      })
    );

    return servers;
  }

}

