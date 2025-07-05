# MCP Lite (CLI + Agent)

一个轻量级的 Model Context Protocol 实现，支持 CLI 调用 Agent 与模型交互。

## 使用

### 安装依赖

```bash
pnpm install
```

### 设置环境变量

创建 `.env` 文件：

```
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

### 运行

```bash
pnpm mcp "总结一下这段代码" ./example.ts
```