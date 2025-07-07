import EmbeddingRetriever from "./embedding-retriever.js";
import * as fs from "fs";
import * as path from "path";
import {logInfo,logTitle} from "./logger.js";

export default class KnowledgeContext {
    private model: string
    private knowledgeDir: string;
    constructor(model: string, knowledgeDir: string) {
        this.model = model;
        this.knowledgeDir = knowledgeDir;
    }

    

    async retrieveContext(prompt?: string) {
        
        if(prompt) 
            return this.retrieveSpecificContext(prompt||"");
        else 
            return this.retrieveFullContext();
    }
    
    private async retrieveFullContext() {
        const files = fs.readdirSync(this.knowledgeDir);
        const documents = [];
        for (const file of files) {
            documents.push(fs.readFileSync(path.join(this.knowledgeDir, file), "utf-8"));
        }
        logTitle("FULL CONTEXT");
        const context = documents.join("\n");
        console.log(context);
        return context;
    }
    private async retrieveSpecificContext(prompt: string) {
        const emb = new EmbeddingRetriever(this.model);

        const files = fs.readdirSync(this.knowledgeDir);
        for (const file of files) {
            const document = fs.readFileSync(path.join(this.knowledgeDir, file), "utf-8");
            await emb.embedDocument(document);
        }
        const context = await emb.retrieve(prompt);
        logTitle("CONTEXT");
        console.log(context);
        return context.map(item => item.document).join("\n");
    }

}