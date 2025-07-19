import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { ExcelExporter } from './excel.js';


// Create an MCP server
const server = new McpServer({
  name: "excel-mcp-server",
  version: "1.0.0"
});


server.registerTool("write-to-excel-file",
  {
    title: "Email Sender",
    description: "Convert a JSON file to excel file .xlsx",
    inputSchema: { jsonPath: z.string(), excelPath: z.string() }
  },
  async ({ jsonPath, excelPath }, context) => {
    const exporter = new ExcelExporter();
    exporter
      .exportFromJsonFile(jsonPath, excelPath)
      .then(() => console.log(' 文件创建成功'))
      .catch((err) => console.error(err));
    return ({
      content: [{ type: "text", text: "Excel 文件创建成功" }]
    });
  }
);

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP Server connected to stdio.");
