// import express from "express";
// import { MyAgent } from "../agent/MyAgent";

// const app = express();
// app.use(express.json());

// interface Context {
//   prompt: string;
//   file: {
//     path: string;
//     content: string;
//   };
//   metadata: Record<string, any>;
// }

// app.post("/mcp", async (req, res) => {
//   try {
//     const { prompt, fileContent } = req.body;

//     if (!prompt || !fileContent) {
//       return res.status(400).json({ error: "Missing prompt or fileContent" });
//     }

//     const context: Context = {
//       prompt,
//       file: {
//         path: "input.ts",
//         content: fileContent,
//       },
//       metadata: {
//         createdAt: new Date().toISOString(),
//       },
//     };

//     const agent = new MyAgent();
//     const plan = await agent.plan(context);
//     const result = await agent.act(plan[0]);
//     const response = await agent.respond(result);

//     res.json({ response });
//   } catch (error) {
//     console.error("Error handling /mcp:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 MCP HTTP server running on port ${PORT}`);
// });
