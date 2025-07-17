import { BertTokenizer } from 'bert-tokenizer';

export default class SimpleEmbedder {
    private tokenizer: BertTokenizer;
    private embeddingDim: number;

    constructor(vocabPath: string, embeddingDim = 64) {
        this.tokenizer = new BertTokenizer(vocabPath);
        this.embeddingDim = embeddingDim;
    }

    tokenize(text: string): string[] {
        const tokenIds: number[] = this.tokenizer.tokenize(text); // returns IDs
        const tokens: string[] = this.tokenizer.convertIdsToTokens(tokenIds);
        return tokens;
    }

    private hashEmbedding(token: string): number[] {
        const vector = new Array(this.embeddingDim).fill(0);
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = (hash * 31 + token.charCodeAt(i)) & 0xffffffff;
        }
        for (let i = 0; i < this.embeddingDim; i++) {
            vector[i] = Math.sin(hash + i);
        }
        return vector;
    }

    private meanPool(vectors: number[][]): number[] {
        const pooled = new Array(this.embeddingDim).fill(0);
        for (const vec of vectors) {
            for (let i = 0; i < this.embeddingDim; i++) {
                pooled[i] += vec[i];
            }
        }
        return pooled.map((v) => v / vectors.length);
    }

    embed(text: string): number[] {
        const tokens = this.tokenize(text);
        const embeddings = tokens.map((token) => this.hashEmbedding(token));
        return this.meanPool(embeddings);
    }
}
