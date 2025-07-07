export interface VectorStoreItem {
    embedding: number[],
    document: string
}

export default class VectorStore {
    private vectorStore: VectorStoreItem[];
    constructor () {
        this.vectorStore = [];
    }
    async addItem(item: VectorStoreItem) {
        this.vectorStore.push(item);
    }

    async search(queryEmbedding: number[], topk: number = 3) {
        const scored = this.vectorStore.map(item => ({
            document: item.document,
            score: this.consineSim(item.embedding, queryEmbedding)
        }));
        
        return scored.sort((a, b) => b.score - a.score).slice(0, topk);
    }

    private consineSim(v1: number[], v2: number[]) {
        const dotProduct = v1.reduce((acc, val, idx) => acc + val * v2[idx], 0);
        const magnitude1 = Math.sqrt(v1.reduce((acc, val)=>acc+val*val, 0));
        const magnitude2 = Math.sqrt(v2.reduce((acc, val)=>acc+val*val, 0));
        return dotProduct/(magnitude1 * magnitude2);
    }
}