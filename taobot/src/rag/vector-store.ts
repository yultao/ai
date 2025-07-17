import { logInfo } from "../util/logger.js";

export interface VectorStoreItem {
    embedding: number[],
    document: string
}

export default class VectorStore {
    private vectorStoreItems: VectorStoreItem[] = [];
    constructor() {
    }
    public async addItem(item: VectorStoreItem) {
        this.vectorStoreItems.push(item);
    }

    public async search(queryEmbedding: number[], topk: number = 3) {
        const scored = this.vectorStoreItems.map(item => ({
            document: item.document,
            score: this.consineSim(item.embedding, queryEmbedding)
        }));


        const top = scored.sort((a, b) => b.score - a.score).slice(0, topk);

        logInfo(`Found top ${topk} ${JSON.stringify(top.map(t => t.score.toFixed(2)))} from ${this.vectorStoreItems.length} records`)
        return top;
    }

    private consineSim(v1: number[], v2: number[]) {
        const dotProduct = v1.reduce((acc, val, idx) => acc + val * v2[idx], 0);
        const magnitude1 = Math.sqrt(v1.reduce((acc, val) => acc + val * val, 0));
        const magnitude2 = Math.sqrt(v2.reduce((acc, val) => acc + val * val, 0));

        return dotProduct / (magnitude1 * magnitude2);
    }
}