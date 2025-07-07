import VectorStore from "./vector-store.js";
import OpenAI from 'openai';
import { pipeline } from '@xenova/transformers';
import { logInfo } from "./logger.js";

export default class EmbeddingRetrievers {

    private apiKey: string;
    private apiBaseURL: string;
    private model: string;
    private vectorStore: VectorStore;

    constructor(apiKey: string, apiBaseURL: string, model: string) {
        this.apiKey = apiKey;
        this.apiBaseURL = apiBaseURL;
        this.model = model;
        this.vectorStore = new VectorStore();
    }

    async embedQuery(query: string): Promise<number[]> {
        const embedding = await this.embed(query);
        return embedding;
    }

    async embedDocument(document: string): Promise<number[]> {
        const embedding = await this.embed(document);
        logInfo("document embedding: " + embedding.length);
        this.vectorStore.addItem({
            embedding: embedding,
            document: document
        });
        return embedding;
    }
    private async embed(text: string): Promise<number[]> {
        // 下载并加载 sentence-transformers 模型（支持中文）
        const extractor = await pipeline(
            'feature-extraction',
            'Xenova/distiluse-base-multilingual-cased-v1' // 多语言模型
        );

        // 生成 embedding
        const output = await extractor('你好，世界'); // 可以是中文
        const oneDArray: number[] = Object.keys(output.data)
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => (output.data as any)[key]);
        console.log("output: " + oneDArray.length);

        return oneDArray;
    }


    private async embed2(text: string): Promise<number[]> {
        const response = await fetch(`${this.apiBaseURL}/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                input: text
            })
        });
        const data = await response.json();
        console.log(data.data[0].embedding);
        return data.data[0].embedding;
    }

    async retrieve(query: string, topk: number = 3) {
        const queryEmbedding = await this.embedQuery(query);
        logInfo("query embedding: " + queryEmbedding.length);
        return this.vectorStore.search(queryEmbedding, topk);
    }
}