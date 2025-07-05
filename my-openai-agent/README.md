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
## 临时笔记

conda show current