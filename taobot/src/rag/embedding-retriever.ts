import VectorStore from "./vector-store.js";
import OpenAI from 'openai';
import { pipeline } from '@xenova/transformers';
import SimpleEmbedder from './simple-embedder.js';
import { logInfo } from "../util/logger.js";

export default class EmbeddingRetriever {
    private model: string;
    private vectorStore: VectorStore;

    constructor(model: string) {
        this.model = model;
        this.vectorStore = new VectorStore();
    }

    async embedQuery(query: string): Promise<number[]> {
        const embedding = await this.embed(query);
        return embedding;
    }

    async embedDocument(document: string): Promise<number[]> {
        const embedding = await this.embed(document);
        this.vectorStore.addItem({
            embedding: embedding,
            document: document
        });
        return embedding;
    }
    private async embed2(text: string): Promise<number[]> {
        const vocabPath = 'node_modules/bert-tokenizer/assets/vocab.json'

        const embedder = new SimpleEmbedder(vocabPath, 64);
        const embeddingVector = embedder.embed(text);
        return embeddingVector;
    }
    private async embed(text: string): Promise<number[]> {
        const extractor = await pipeline('feature-extraction', this.model);

        // 生成 embedding
        const output = await extractor(text,{ pooling: 'mean', normalize: true }); // 可以是中文
        // console.log('Output shape:', JSON.stringify(output.data)); // e.g. [30, 768]
        const oneDArray: number[] = Object.keys(output.data)
            .sort((a, b) => Number(a) - Number(b))
            .map((key) => (output.data as any)[key]);
        // console.log("output: " + oneDArray.length);

        return oneDArray;
    }

    async retrieve(queryEmbedding: number[], topk: number = 3) {
        return this.vectorStore.search(queryEmbedding, topk);
    }
}