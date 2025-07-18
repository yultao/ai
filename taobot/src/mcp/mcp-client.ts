
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types";
import { logError } from "../util/logger.js";


export default class MCPClient {
    private name: string;
    private mcp: Client;
    private transport: StdioClientTransport | null = null;
    private tools: Tool[] = [];
    private command: string;
    private args: string[];

    constructor(name:string, command: string, args: string[], version?: string) {
        this.name = name;
        this.mcp = new Client({ name: name, version: version || "1.0.0" });
        this.command = command;
        this.args = args;
    }
 
    public async init() {
        try {
            this.transport = new StdioClientTransport({
                command: this.command,
                args: this.args,
            });
            await this.mcp.connect(this.transport);

            // Fetch tools from the MCP server
            const toolsResult = await this.mcp.listTools();
            this.tools = toolsResult.tools.map((tool) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                };
            });
            console.log(
                "Connected "+this.name+" to server with tools:",
                this.tools.map(({ name }) => name)
            );
        } catch (e) {
            console.log("Failed to connect to MCP server: ", e);
            throw e;
        }
    }

    
    public async close() {
        await this.mcp.close();
    }

    public getTools() {
        return this.tools;
    }
    public async callTool(toolName: string, args: Record<string, any>) {
        try {
            const res = this.mcp.callTool({name: toolName, arguments: args});
            return res;
        } catch (e) {
            logError("Failed to call tool "+toolName);
            return "";
        } 
        
    }

    public getName() {
        return this.name;
    }
}
