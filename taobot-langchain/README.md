mkdir my-ts-node-project
cd my-ts-node-project
npm init -y

npm install --save-dev typescript ts-node @types/node
typescript – the TypeScript compiler
ts-node – run TypeScript files directly
@types/node – type definitions for Node.js

npx tsc --init


---

npm install langchain dotenv


  "type": "module",
  "scripts": {
    "dev": "node --loader ts-node/esm src/index.ts",
  }

下面不行

    "type": "module",
  "scripts": {
    "dev": "ts-node src/index.ts",
  }




    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,

npm install langchain @langchain/openai dotenv
