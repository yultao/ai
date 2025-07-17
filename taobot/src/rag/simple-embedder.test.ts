import SimpleEmbedder from './simple-embedder.js';


// Usage example:

async function main() {
  // Path to your vocab.txt file
  const vocabPath = 'node_modules/bert-tokenizer/assets/vocab.json'

  const embedder = new SimpleEmbedder(vocabPath, 64);

  const inputText = 'Hello, this is a test sentence.';
  const embeddingVector = embedder.embed(inputText);

  console.log('Tokens:', embedder.tokenize(inputText));
  console.log('Embedding vector:', embeddingVector);
}

main();
