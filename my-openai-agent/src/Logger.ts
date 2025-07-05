import chalk from "chalk";

export default function logInfo(message: string): void {
    const totalLength = 80;
    const messageLength = message.length;
    const paddingLength = totalLength - messageLength - 10; // 10 for "[INFO] " prefix
    const padding = ' '.repeat(Math.max(paddingLength, 0)); // Ensure non-negative padding length
    const paddedMessage = `[INFO] ${message}${padding}`;

    console.log(chalk.blue(`${paddedMessage}`));
}

