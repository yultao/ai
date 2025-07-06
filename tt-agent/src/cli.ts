#!/usr/bin/env node

import Bot  from './bot.js';
async function main() {
    const bot = new Bot();
    await bot.chat();
}
main();