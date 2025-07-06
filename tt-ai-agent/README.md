# AI Agent
## 目标
实现一个简易的headless的Agent

## 架构
Agent

OpenAI Client
OpenRouter + LLM (deepseek/deepseek-chat:free)
MCP Client


MCP Servers
- 


## 语言
nodejs
typescript

## 步骤
0. 初始化
npm init -y

1. 安装运行时依赖：
npm install dotenv openai @modelcontextprotocol/sdk chalk

2. 安装开发依赖：
npm install --save-dev typescript ts-node nodemon @types/node
3. 初始化 TypeScript 配置
npx tsc --init

4. 编译
wrong
npm run tsc 
right
npx tsc 

5. 运行
node dist/index.js

6. 打包
#!/usr/bin/env node

  "bin": {
    "my-openai-agent": "dist/cli.js"
  },
  "exports": {
    ".": "./dist/main.js",
    "./McpClient": "./dist/McpClient.js"
  },


  "declaration": true
npm pack

7. 安装
8. 调用
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16"
  }
}
或
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
当前目录下必须有
mcpconfig.json
{
  "mcpServers": {
    "slack-mcp": {
      "disabled": false,
      "command": "node",
      "args": ["C:/Workspace/ai/slack-mcp-server/build/index.js"]
    }
  }
}

.env
OPENAI_API_KEY=sk-xxx
OPENAI_API_BASE=https://openrouter.ai/api/v1
## 临时笔记

conda show current