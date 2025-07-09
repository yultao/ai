import EmbeddingRetriever from "./embedding-retriever.js";
import * as fs from 'fs/promises';
import * as path from "path";
import { logInfo, logTitle } from "./logger.js";

export default class KnowledgeContext {
    private model: string
    private knowledgeDir: string;
    constructor(model: string, knowledgeDir: string) {
        this.model = model;
        this.knowledgeDir = knowledgeDir;
    }



    async retrieveContext(prompt?: string) {

        if (prompt)
            return this.retrieveSpecificContext(prompt || "");
        else
            return this.retrieveFullContext();
    }
    private async readAllFilesRecursive(dir: string): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await this.readAllFilesRecursive(fullPath));
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }

        return files;
    }

    private async retrieveFullContext() {
        const files = await this.readAllFilesRecursive(this.knowledgeDir);
        const documents: string[] = [];
        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            documents.push(content);
        }
        logTitle("FULL CONTEXT");
        const context = documents.join("\n");
        console.log(context);
        return context;
    }

    private async retrieveSpecificContext(prompt: string) {
        const emb = new EmbeddingRetriever(this.model);
        const files = await this.readAllFilesRecursive(this.knowledgeDir);

        for (const file of files) {
            const document = await fs.readFile(file, 'utf-8');
            await emb.embedDocument(document);
        }

        const context = await emb.retrieve(prompt);
        logTitle("CONTEXT");
        console.log(context);
        return context.map(item => item.document).join("\n");
    }
}