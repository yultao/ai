import * as fs from "fs";
import * as path from "path";

interface McpServerConfig {
  command: string;
  args: string[];
  disabled?: boolean;
}

interface Config {
  mcpServers: {
    [name: string]: McpServerConfig;
  };
}

interface ServerEntry {
  name: string;
  command: string;
  args: string[];
  disabled: boolean;
}

export function getMcpServerConfigs(dir:string): ServerEntry[] {
  const configPath = path.join(dir, "mcpconfig.json");
  const rawData = fs.readFileSync(configPath, "utf-8");
  const config: Config = JSON.parse(rawData);

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

