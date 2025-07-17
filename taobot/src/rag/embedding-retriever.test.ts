import EmbeddingRetriever from "./embedding-retriever.js";
const er = new EmbeddingRetriever("this.model");

function test(){}
const v1: number[] = await er.embedQuery("I am in Shanghai");
const v2: number[] = await er.embedQuery("I am in Toronto");
console.log(v1.length + " vs " + v2.length)
function dis(v1: number[], v2: number[]) {
    const dotProduct = v1.reduce((acc, val, idx) => acc + val * v2[idx], 0);
    const magnitude1 = Math.sqrt(v1.reduce((acc, val) => acc + val * val, 0));
    const magnitude2 = Math.sqrt(v2.reduce((acc, val) => acc + val * val, 0));

    const d = Math.abs(dotProduct / (magnitude1 * magnitude2));
    return d;
}
console.log(dis(v1, v2));


const v3: number[] = await er.embedQuery("I am in Shanghai");
const v4: number[] = await er.embedQuery("I am in Toronto");

console.log(dis(v3, v4)); 



const v5: number[] = await er.embedQuery("I am in Shanghai");
const v6: number[] = await er.embedQuery("How are you. I have been in Shanghai too");

console.log(dis(v5, v6)); 


const v7: number[] = await er.embedQuery("I am good thanks!");
const v8: number[] = await er.embedQuery("How are you");

console.log(dis(v7, v8)); 