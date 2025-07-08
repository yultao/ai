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
}

interface EmbeddingConfig {
  model: string;
  apiKey: string;
  apiBaseURL: string;
}

interface Config {
  model: string;
  mcpServers: {
    [name: string]: McpServerConfig;
  };
  apiProvider: ApiProviderConfig;
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
  private constructor(aiConfigPath: string) { 
    this.aiConfigPath = aiConfigPath;
    this.readConfig();
  }

  public static getInstance(aiConfigPath: string = "aiconfig.json"): AiConfig {
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

  getModelConfig(): string {
    const config = this.readConfig();
    return config.model;
  }

  getEmbeddingConfig(): EmbeddingConfig {
    const config = this.readConfig();
    return config.embedding;
  }

  getApiProviderConfig(): ApiProviderConfig {
    const config = this.readConfig();
    return config.apiProvider;
    // const apiProviderConfig = config.apiProvider;
    // return {
    //   apiKey: apiProviderConfig.apiKey,
    //   apiBaseURL: apiProviderConfig.apiBaseURL,
    // };
  }
  getMcpServerConfigs(): ServerEntry[] {
    const config = this.readConfig();
    const servers: ServerEntry[] = Object.entries(config.mcpServers).map(
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

