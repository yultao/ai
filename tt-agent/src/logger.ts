import chalk from "chalk";

function getMessage(prefix: string, message: string): string {
    const totalLength = 80;
    const messageLength = message.length;
    const paddingLength = totalLength - messageLength - 10; // 10 for "[INFO] " prefix
    const padding = ' '.repeat(Math.max(paddingLength, 0)); // Ensure non-negative padding length
    const paddedMessage = `[${prefix}] ${message}${padding}`;
    return paddedMessage;
}

export  function logInfo(message: string): void {
    console.log(chalk.blue(`${getMessage("INFO", message)}`));
}

export  function logError(message: string): void {
    console.log(chalk.red(`${getMessage("ERRR", message)}`));
}


export function logTitle(message: string): void {
    const totalLength = 80;
    const messageLength = message.length;
    const padding = Math.max(totalLength- messageLength - 4, 0); // Ensure non-negative padding length
    const paddedMessage = `${'='.repeat(Math.floor(padding/2))} ${message} ${'='.repeat(Math.ceil(padding/2))}`;

    console.log(chalk.bold.cyanBright(`${paddedMessage}`));
}