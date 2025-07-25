import EmbeddingRetriever from "./embedding-retriever.js";
import * as fs from 'fs/promises';
import * as path from "path";
import { logInfo, logTitle } from "../util/logger.js";
import { existsSync } from 'fs';
export default class KnowledgeContext {
    private knowledgeDir: string;

    private er: EmbeddingRetriever;
    constructor(model: string, knowledgeDir: string) {
     
        this.knowledgeDir = knowledgeDir;
        this.er = new EmbeddingRetriever(model);
        
    }

    public async init() {
        const files = await this.readAllFilesRecursive(this.knowledgeDir);

        for (const file of files) {
            const document = await fs.readFile(file, 'utf-8');
            const messages = JSON.parse(document);
            for (const message of messages) {
                await this.er.embedDocument(JSON.stringify(message));
            }
        }
    }

    async retrieveContext(prompt?: string) {

        if (prompt)
            return this.retrieveSpecificContext(prompt || "");
        else
            return this.retrieveFullContext();
    }
    private async readAllFilesRecursive(dir: string): Promise<string[]> {
        if(!(existsSync(dir))) return [];
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
        const queryEmbedding = await this.er.embedQuery(prompt);
        const context = await this.er.retrieve(queryEmbedding);
        logTitle("CONTEXT");
        console.log(context);
        return context.map(item => item.document).join("\n");
    }
}