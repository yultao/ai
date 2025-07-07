import VectorStore from "./vector-store.js";

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
        this.vectorStore.addItem({
            embedding: embedding,
            document: document
        });
        return embedding;
    }


    private async embed(document: string): Promise<number[]> {
        const response = await fetch(`${this.apiBaseURL}/embeddings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                input: document
            })
        });
        const data = await response.json();
        console.log(data.data[0].embedding);
        return data.data[0].embedding;
    }

    async retrieve(query: string, topk: number = 3) {
        const queryEmbedding = await this.embedQuery(query);
        return this.vectorStore.search(queryEmbedding, topk);
    }
}